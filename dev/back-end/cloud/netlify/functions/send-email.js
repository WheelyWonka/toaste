const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    console.log('=== EMAIL FUNCTION CALLED ===');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Headers:', JSON.stringify(event.headers, null, 2));
    console.log('Body:', event.body);
    
    // Handle CORS
    const allowedOrigins = [
        'https://preprod.toastebikepolo.ca'
    ];
    
    const origin = event.headers.origin || event.headers.Origin;
    const corsHeaders = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
    };

    if (event.httpMethod === 'OPTIONS') {
        console.log('OPTIONS request - returning CORS headers');
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        console.log('Invalid HTTP method:', event.httpMethod);
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('Parsing request body...');
        const { orderData, emailType } = JSON.parse(event.body);
        
        console.log('=== EMAIL REQUEST DATA ===');
        console.log('Email Type:', emailType);
        console.log('Order Data:', JSON.stringify(orderData, null, 2));
        
        // Log email attempt for debugging
        console.log('Attempting to send email:', {
            emailType,
            to: emailType === 'customer' ? orderData.customerEmail : process.env.PROTON_EMAIL,
            orderCode: orderData.orderCode
        });

        // Check environment variables
        console.log('=== ENVIRONMENT VARIABLES CHECK ===');
        console.log('PROTON_EMAIL exists:', !!process.env.PROTON_EMAIL);
        console.log('PROTON_EMAIL value:', process.env.PROTON_EMAIL ? `${process.env.PROTON_EMAIL.substring(0, 3)}***` : 'NOT SET');
        console.log('PROTON_APP_PASSWORD exists:', !!process.env.PROTON_APP_PASSWORD);
        console.log('PROTON_APP_PASSWORD length:', process.env.PROTON_APP_PASSWORD ? process.env.PROTON_APP_PASSWORD.length : 0);

        // Create transporter using Proton Mail SMTP
        console.log('Creating Proton Mail transporter...');
        const transporter = nodemailer.createTransport({
            host: 'mail.proton.me',
            port: 465,
            secure: true, // Use SSL for port 465
            auth: {
                user: process.env.PROTON_EMAIL,
                pass: process.env.PROTON_APP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 30000, // 30 seconds
            greetingTimeout: 15000,   // 15 seconds
            socketTimeout: 30000      // 30 seconds
        });

        // Verify transporter configuration
        console.log('Verifying transporter configuration...');
        await transporter.verify();
        console.log('✅ Transporter verification successful');

        let emailContent;
        let subject;

        if (emailType === 'customer') {
            console.log('=== PREPARING CUSTOMER EMAIL ===');
            // Customer confirmation email
            subject = `Your Toasté Bike Polo Order - ${orderData.orderCode}`;
            console.log('Customer email subject:', subject);
            console.log('Customer email to:', orderData.customerEmail);
            emailContent = {
                from: process.env.PROTON_EMAIL,
                to: orderData.customerEmail,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2d2218;">Your Order Confirmation</h2>
                        <p>Hi ${orderData.customerName},</p>
                        <p>Thank you for your order! Here are your order details:</p>
                        
                        <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Code: ${orderData.orderCode}</h3>
                            <p><strong>Total: CAD$${orderData.total.toFixed(2)}</strong></p>
                        </div>
                        
                        <h3>Your Items:</h3>
                        <ul>
                            ${orderData.products.map(product => 
                                `<li>${product.quantity}x ${product.spokeCount} spokes, ${product.wheelSize} - CAD$${product.price.toFixed(2)}</li>`
                            ).join('')}
                        </ul>
                        
                        <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Payment Instructions</h3>
                            <p><strong>Send payment to: toastebikepolo@proton.me</strong></p>
                            <p>Canadians can use Interac, others can use PayPal.</p>
                            <p><strong>⚠️ Don't forget to include your order code in the payment details!</strong></p>
                        </div>
                        
                        <p>We'll process your order as soon as we receive your payment.</p>
                        <p>Thanks for choosing Toasté Bike Polo!</p>
                        <p>Best regards,<br>Germain</p>
                    </div>
                `
            };
        } else if (emailType === 'owner') {
            console.log('=== PREPARING OWNER EMAIL ===');
            // Owner notification email
            subject = `New Order Received - ${orderData.orderCode}`;
            console.log('Owner email subject:', subject);
            console.log('Owner email to:', process.env.PROTON_EMAIL);
            emailContent = {
                from: process.env.PROTON_EMAIL,
                to: process.env.PROTON_EMAIL,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2d2218;">New Order Received!</h2>
                        
                        <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Code: ${orderData.orderCode}</h3>
                            <p><strong>Total: CAD$${orderData.total.toFixed(2)}</strong></p>
                        </div>
                        
                        <h3>Customer Information:</h3>
                        <p><strong>Name:</strong> ${orderData.customerName}</p>
                        <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                        <p><strong>Address:</strong> ${orderData.customerAddress}</p>
                        ${orderData.customerNotes ? `<p><strong>Notes:</strong> ${orderData.customerNotes}</p>` : ''}
                        
                        <h3>Order Items:</h3>
                        <ul>
                            ${orderData.products.map(product => 
                                `<li>${product.quantity}x ${product.spokeCount} spokes, ${product.wheelSize} - CAD$${product.price.toFixed(2)}</li>`
                            ).join('')}
                        </ul>
                        
                        <p>Order placed on: ${new Date().toLocaleString()}</p>
                    </div>
                `
            };
        } else {
            console.log('❌ Invalid email type:', emailType);
            throw new Error('Invalid email type');
        }

        console.log('=== SENDING EMAIL ===');
        console.log('Email content prepared:', {
            from: emailContent.from,
            to: emailContent.to,
            subject: emailContent.subject,
            htmlLength: emailContent.html ? emailContent.html.length : 0
        });

        // Send email
        const result = await transporter.sendMail(emailContent);
        
        console.log('✅ Email sent successfully:', {
            messageId: result.messageId,
            emailType,
            to: emailContent.to,
            accepted: result.accepted,
            rejected: result.rejected
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: true, 
                message: 'Email sent successfully',
                messageId: result.messageId
            })
        };

    } catch (error) {
        console.error('❌ ERROR SENDING EMAIL:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Failed to send email',
                details: error.message,
                errorType: error.name
            })
        };
    }
};

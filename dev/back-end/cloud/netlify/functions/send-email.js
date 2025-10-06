const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
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
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { orderData, emailType } = JSON.parse(event.body);

        // Create transporter using Proton Mail SMTP
        const transporter = nodemailer.createTransporter({
            host: 'mail.proton.me',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.PROTON_EMAIL,
                pass: process.env.PROTON_APP_PASSWORD
            }
        });

        let emailContent;
        let subject;

        if (emailType === 'customer') {
            // Customer confirmation email
            subject = `Your Toasté Bike Polo Order - ${orderData.orderCode}`;
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
            // Owner notification email
            subject = `New Order Received - ${orderData.orderCode}`;
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
            throw new Error('Invalid email type');
        }

        // Send email
        await transporter.sendMail(emailContent);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: true, 
                message: 'Email sent successfully' 
            })
        };

    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Failed to send email',
                details: error.message 
            })
        };
    }
};

// Using Resend API for reliable serverless email sending

// Function to send email via Resend API
async function sendEmailViaProtonAPI(emailContent) {
    console.log('Sending email via Resend API...');
    
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
        throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    console.log('Using Resend API for email sending...');
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
            to: [emailContent.to],
            subject: emailContent.subject,
            html: emailContent.html
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Resend API response:', result);
    return { messageId: result.id };
}

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
        console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
        console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0);

        // Using Resend API
        console.log('Using Resend API for sending emails...');

        let emailContent;
        let subject;

        if (emailType === 'customer') {
            console.log('=== PREPARING CUSTOMER EMAIL ===');
            // Customer confirmation email
            subject = `Your Toasté Bike Polo Order - ${orderData.orderCode}`;
            console.log('Customer email subject:', subject);
            console.log('Customer email to:', orderData.customerEmail);
            emailContent = {
                from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
                to: orderData.customerEmail,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 10px; display:block; width: 100%; background-color: #efca52;">
                           <img src="https://preprod.toastebikepolo.ca/assets/graphics/images/cover-mail.jpg" alt="Toasté Bike Polo Cover" style="width: 100%; height: auto; display: block; margin: 0 auto;">
                        </div>
                        <h2 style="color: #2d2218; text-align: center;">Your Order Confirmation</h2>
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
                from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
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

        console.log('=== SENDING EMAIL VIA RESEND API ===');
        console.log('Email content prepared:', {
            from: emailContent.from,
            to: emailContent.to,
            subject: emailContent.subject,
            htmlLength: emailContent.html ? emailContent.html.length : 0
        });

        // Send email using Resend API
        const result = await sendEmailViaProtonAPI(emailContent);
        
        console.log('✅ Email sent successfully via Resend API:', {
            messageId: result.messageId,
            emailType,
            to: emailContent.to
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: true, 
                message: 'Email sent successfully via Resend API',
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

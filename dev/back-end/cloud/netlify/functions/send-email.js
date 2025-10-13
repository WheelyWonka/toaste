// Using Resend API for reliable serverless email sending
const { withCors, createCorsResponse } = require('./cors');

// Get email content based on language
function getEmailContent(orderData, emailType, language = 'en') {
    const isFrench = language === 'fr';
    
    if (emailType === 'customer') {
        const subject = isFrench 
            ? `Tacommande Toasté Bike Polo - ${orderData.orderCode}`
            : `Your Toasté Bike Polo Order - ${orderData.orderCode}`;
            
        const html = isFrench ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 10px; display:block; width: 100%; background-color: #efca52;">
                   <img src="https://preprod.toastebikepolo.ca/assets/graphics/images/cover-mail.jpg" alt="Toasté Bike Polo Cover" style="width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
                <h2 style="color: #2d2218; text-align: center;">Confirmation de votre commande</h2>
                <p>Salut ${orderData.customerName},</p>
                <p>Merci pour ta commande ! Voici les détails :</p>
                
                <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Code de commande : ${orderData.orderCode}</h3>
                    <p style="margin-bottom:0;"><strong>Total : CAD$${orderData.total.toFixed(2)}</strong></p>
                </div>
                
                <h3>Tes articles :</h3>
                <ul>
                    ${orderData.products.map(product => 
                        `<li>${product.quantity}x ${product.spokeCount} rayons, ${product.wheelSize}" - CAD$${product.price.toFixed(2)}</li>`
                    ).join('')}
                </ul>
                
                <h3>Détail des coûts :</h3>
                <div style="background: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Sous-total :</span>
                        <span>CAD$${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Taxes (15%) :</span>
                        <span>CAD$${orderData.taxes.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Frais de livraison :</span>
                        <span>CAD$${orderData.shippingFee.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px;">
                        <span>Total :</span>
                        <span>CAD$${orderData.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Instructions de paiement</h3>
                    <p><strong>Envoie ton paiement à : toastebikepolo@proton.me</strong></p>
                    <p>Les Canadien.nes peuvent utiliser Interac, les autres peuvent utiliser PayPal.</p>
                    <p><strong>🚨 N'oublie pas d'inclure ton code de commande dans les détails du paiement !</strong></p>
                </div>
                
                <p>On va traiter ta commande dès qu'on reçoit ton paiement.</p>
                <p>Merci d'avoir choisi Toasté Bike Polo !</p>
                <p>Salutations,<br>Germain</p>
            </div>
        ` : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 10px; display:block; width: 100%; background-color: #efca52;">
                   <img src="https://preprod.toastebikepolo.ca/assets/graphics/images/cover-mail.jpg" alt="Toasté Bike Polo Cover" style="width: 100%; height: auto; display: block; margin: 0 auto;">
                </div>
                <h2 style="color: #2d2218; text-align: center;">Your Order Confirmation</h2>
                <p>Hi ${orderData.customerName},</p>
                <p>Thank you for your order! Here are your order details:</p>
                
                <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Code: ${orderData.orderCode}</h3>
                    <p style="margin-bottom:0;"><strong>Total: CAD$${orderData.total.toFixed(2)}</strong></p>
                </div>
                
                <h3>Your Items:</h3>
                <ul>
                    ${orderData.products.map(product => 
                        `<li>${product.quantity}x ${product.spokeCount} spokes, ${product.wheelSize}" - CAD$${product.price.toFixed(2)}</li>`
                    ).join('')}
                </ul>
                
                <h3>Cost Breakdown:</h3>
                <div style="background: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Subtotal:</span>
                        <span>CAD$${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Taxes (15%):</span>
                        <span>CAD$${orderData.taxes.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Shipping:</span>
                        <span>CAD$${orderData.shippingFee.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px;">
                        <span>Total:</span>
                        <span>CAD$${orderData.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Payment Instructions</h3>
                    <p><strong>Send payment to: toastebikepolo@proton.me</strong></p>
                    <p>Canadians can use Interac, others can use PayPal.</p>
                    <p><strong>🚨 Don't forget to include your order code in the payment details!</strong></p>
                </div>
                
                <p>We'll process your order as soon as we receive your payment.</p>
                <p>Thanks for choosing Toasté Bike Polo!</p>
                <p>Best regards,<br>Germain</p>
            </div>
        `;
        
        return {
            from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
            to: orderData.customerEmail,
            subject: subject,
            html: html
        };
    } else if (emailType === 'owner') {
        // Owner emails are always in English for internal use
        const subject = `New Order Received - ${orderData.orderCode}`;
            
        const html = `
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
                        `<li>${product.quantity}x ${product.spokeCount} spokes, ${product.wheelSize}" - CAD$${product.price.toFixed(2)}</li>`
                    ).join('')}
                </ul>
                
                <h3>Cost Breakdown:</h3>
                <div style="background: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Subtotal:</span>
                        <span>CAD$${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Taxes (15%):</span>
                        <span>CAD$${orderData.taxes.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Shipping:</span>
                        <span>CAD$${orderData.shippingFee.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px;">
                        <span>Total:</span>
                        <span>CAD$${orderData.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <p>Order placed on: ${new Date().toLocaleString()}</p>
            </div>
        `;
        
        return {
            from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
            to: process.env.PROTON_EMAIL,
            subject: subject,
            html: html
        };
    }
    
    throw new Error('Invalid email type');
}

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

// Main email handler
async function emailHandler(event, context) {
    console.log('=== EMAIL FUNCTION CALLED ===');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Headers:', JSON.stringify(event.headers, null, 2));
    console.log('Body:', event.body);

    if (event.httpMethod !== 'POST') {
        console.log('Invalid HTTP method:', event.httpMethod);
        return createCorsResponse(405, event, { error: 'Method not allowed' });
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

        console.log('=== PREPARING EMAIL CONTENT ===');
        console.log('Email type:', emailType);
        console.log('Language:', orderData.language || 'en');
        
        const emailContent = getEmailContent(orderData, emailType, orderData.language);
        console.log('Email subject:', emailContent.subject);
        console.log('Email to:', emailContent.to);

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

        return createCorsResponse(200, event, { 
            success: true, 
            message: 'Email sent successfully via Resend API',
            messageId: result.messageId
        });

    } catch (error) {
        console.error('❌ ERROR SENDING EMAIL:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return createCorsResponse(500, event, { 
            error: 'Failed to send email',
            details: error.message,
            errorType: error.name
        });
    }
}

// Export handler with CORS middleware
exports.handler = withCors(emailHandler);

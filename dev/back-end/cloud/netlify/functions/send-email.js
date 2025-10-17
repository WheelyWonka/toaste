// Using Resend API for reliable serverless email sending
const { withCors, createCorsResponse } = require('./cors');
const { log, handleAsyncError } = require('./utils');

// Email templates (simplified)
const EMAIL_TEMPLATES = {
  customer: {
    en: {
      subject: (code) => `Your Toasté Bike Polo Order - ${code}`,
      greeting: (name) => `Hi ${name},`,
      title: 'Your Order Confirmation',
      thankYou: 'Thank you for your order! Here are your order details:',
      items: 'Your Items:',
      costBreakdown: 'Cost Breakdown:',
      paymentTitle: 'Payment Instructions',
      paymentText: 'Send payment to: toastebikepolo@proton.me',
      paymentNote: 'Canadians can use Interac, others can use PayPal.',
      paymentWarning: '🚨 Don\'t forget to include your order code in the payment details!',
      footer: 'We\'ll process your order as soon as we receive your payment.\n\nThanks for choosing Toasté Bike Polo!\n\nBest regards,\n\nGermain'
    },
    fr: {
      subject: (code) => `Ta commande Toasté Bike Polo - ${code}`,
      greeting: (name) => `Salut ${name},`,
      title: 'Confirmation de votre commande',
      thankYou: 'Merci pour ta commande ! Voici les détails :',
      items: 'Tes articles :',
      costBreakdown: 'Détail des coûts :',
      paymentTitle: 'Instructions de paiement',
      paymentText: 'Envoie ton paiement à : toastebikepolo@proton.me',
      paymentNote: 'Les Canadien.nes peuvent utiliser Interac, les autres peuvent utiliser PayPal.',
      paymentWarning: '🚨 N\'oublie pas d\'inclure ton code de commande dans les détails du paiement !',
      footer: 'On va traiter ta commande dès qu\'on reçoit ton paiement.\n\nMerci d\'avoir choisi Toasté Bike Polo !\n\nSalutations,\n\nGermain'
    }
  },
  owner: {
    subject: (code) => `New Order Received - ${code}`,
    title: 'New Order Received!',
    customerInfo: 'Customer Information:',
    orderItems: 'Order Items:',
    costBreakdown: 'Cost Breakdown:',
    orderDate: 'Order placed on:'
  }
};

// Generate email content (simplified)
function getEmailContent(orderData, emailType, language = 'en') {
  if (emailType === 'customer') {
    const template = EMAIL_TEMPLATES.customer[language] || EMAIL_TEMPLATES.customer.en;
    const spokeText = language === 'fr' ? 'rayons' : 'spokes';
    
    return {
      from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
      to: orderData.customerEmail,
      subject: template.subject(orderData.orderCode),
      html: generateCustomerEmailHTML(orderData, template, spokeText)
    };
  } else if (emailType === 'owner') {
    const template = EMAIL_TEMPLATES.owner;
    
    return {
      from: 'Toasté Bike Polo <noreply@toastebikepolo.ca>',
      to: process.env.PROTON_EMAIL,
      subject: template.subject(orderData.orderCode),
      html: generateOwnerEmailHTML(orderData, template)
    };
  }
  
  throw new Error('Invalid email type');
}

// Generate customer email HTML (simplified)
function generateCustomerEmailHTML(orderData, template, spokeText) {
  const productsList = orderData.products.map(product => 
    `<li>${product.quantity}x ${product.spokeCount} ${spokeText}, ${product.wheelSize}" - CAD$${product.price.toFixed(2)}</li>`
  ).join('');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 10px; background-color: #efca52;">
        <img src="https://preprod.toastebikepolo.ca/assets/graphics/images/cover-mail.jpg" alt="Toasté Bike Polo Cover" style="width: 100%; height: auto; display: block;">
      </div>
      <h2 style="color: #2d2218; text-align: center;">${template.title}</h2>
      <p>${template.greeting(orderData.customerName)}</p>
      <p>${template.thankYou}</p>
      
      <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Code: ${orderData.orderCode}</h3>
        <p style="margin-bottom:0;"><strong>Total: CAD$${orderData.total.toFixed(2)}</strong></p>
      </div>
      
      <h3>${template.items}</h3>
      <ul>${productsList}</ul>
      
      <h3>${template.costBreakdown}</h3>
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
        <h3 style="margin-top: 0;">${template.paymentTitle}</h3>
        <p><strong>${template.paymentText}</strong></p>
        <p>${template.paymentNote}</p>
        <p><strong>${template.paymentWarning}</strong></p>
      </div>
      
      <p>${template.footer.replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

// Generate owner email HTML (simplified)
function generateOwnerEmailHTML(orderData, template) {
  const productsList = orderData.products.map(product => 
    `<li>${product.quantity}x ${product.spokeCount} spokes, ${product.wheelSize}" - CAD$${product.price.toFixed(2)}</li>`
  ).join('');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2d2218;">${template.title}</h2>
      
      <div style="background: #efca52; padding: 20px; border: 3px solid #2d2218; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Code: ${orderData.orderCode}</h3>
        <p><strong>Total: CAD$${orderData.total.toFixed(2)}</strong></p>
      </div>
      
      <h3>${template.customerInfo}</h3>
      <p><strong>Name:</strong> ${orderData.customerName}</p>
      <p><strong>Email:</strong> ${orderData.customerEmail}</p>
      <p><strong>Address:</strong> ${orderData.customerAddress}</p>
      ${orderData.customerNotes ? `<p><strong>Notes:</strong> ${orderData.customerNotes}</p>` : ''}
      
      <h3>${template.orderItems}</h3>
      <ul>${productsList}</ul>
      
      <h3>${template.costBreakdown}</h3>
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
      
      <p>${template.orderDate} ${new Date().toLocaleString()}</p>
    </div>
  `;
}

// Function to send email via Resend API
async function sendEmailViaProtonAPI(emailContent) {
    log('INFO', 'Sending email via Resend API', {
        to: emailContent.to,
        subject: emailContent.subject
    });
    
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
        log('ERROR', 'RESEND_API_KEY environment variable is not set');
        throw new Error('RESEND_API_KEY environment variable is not set');
    }
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
        log('ERROR', 'Resend API error', {
            status: response.status,
            statusText: response.statusText,
            errorText
        });
        throw new Error(`Resend API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    log('INFO', 'Resend API response received', { result });
    return { messageId: result.id };
}

// Main email handler
async function emailHandler(event, context) {
    log('INFO', 'Email function called', {
        method: event.httpMethod,
        headers: event.headers,
        body: event.body ? 'Present' : 'Missing'
    });

    if (event.httpMethod !== 'POST') {
        log('WARN', 'Invalid HTTP method', { method: event.httpMethod });
        return createCorsResponse(405, event, { error: 'Method not allowed' });
    }

    try {
        const { orderData, emailType } = JSON.parse(event.body);
        
        log('INFO', 'Email request data parsed', {
            emailType,
            hasOrderData: !!orderData,
            orderCode: orderData?.orderCode,
            customerEmail: orderData?.customerEmail
        });
        
        // Log email attempt for debugging
        log('INFO', 'Attempting to send email', {
            emailType,
            to: emailType === 'customer' ? orderData.customerEmail : process.env.PROTON_EMAIL,
            orderCode: orderData.orderCode
        });

        // Check environment variables
        log('INFO', 'Environment variables check', {
            hasResendApiKey: !!process.env.RESEND_API_KEY,
            resendApiKeyLength: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0
        });

        log('INFO', 'Preparing email content', {
            emailType,
            language: orderData.language || 'en'
        });
        
        const emailContent = getEmailContent(orderData, emailType, orderData.language);
        log('INFO', 'Email content prepared', {
            subject: emailContent.subject,
            to: emailContent.to,
            from: emailContent.from,
            htmlLength: emailContent.html ? emailContent.html.length : 0
        });

        // Send email using Resend API
        const result = await sendEmailViaProtonAPI(emailContent);
        
        log('INFO', 'Email sent successfully via Resend API', {
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
        return handleAsyncError(error, event, 'Email sending');
    }
}

// Export handler with CORS middleware
exports.handler = withCors(emailHandler);

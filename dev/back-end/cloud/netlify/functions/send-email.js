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
                        <div style="text-align: center; margin-bottom: 30px;">
                            <svg width="200" height="120" viewBox="0 0 765 456" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M414.32 43.37C410.6 47.54 421.24 51.94 423.79 53.07C440.63 60.53 469.38 65.03 470.69 89.02C471.36 101.37 467.36 109.28 457.84 116.12C439.84 129.04 416.48 128.12 395.82 124.55C390.7 123.66 372.47 118.92 370.24 114.14C368.59 110.61 370.51 102.05 370.72 97.7C370.84 95.35 370.14 93.36 370.45 90.73C371.43 82.49 375.7 83.97 381.79 85.42C395.37 88.65 409.5 99.32 424.06 95.63C436.84 92.39 423.84 86.94 418.76 84.97C398.72 77.19 352.97 63.24 372.73 31.28C389.97 3.39999 431.69 6.64001 456.96 18.67C462.34 21.23 464.79 22.51 465.5 29.31C466.01 34.22 465.13 44.23 464.23 49.21C463.84 51.34 463.25 52.6 461.03 52.85C455.99 53.41 443.99 46.13 438.36 44.16C433.21 42.36 418.35 38.86 414.33 43.38L414.32 43.37Z" fill="#2D2218"/>
                                <path d="M326.18 138.99C324.27 137.21 323.67 132.21 322.62 129.7C319.86 123.1 318.12 125.14 312.46 124.7C307.68 124.33 302.91 123.81 298.05 124.1C296.35 124.2 291.44 124.62 290.19 125.14C284.94 127.33 287.26 139.42 279.11 140.75C269.11 140.31 257.7 142.18 248 139.46C246.67 139.09 244.11 138.48 243.69 137.03C242.67 133.51 245.86 125.4 247.19 121.82C254.63 101.9 264.73 81.71 273 62C276.53 53.6 279.57 42.98 283.31 35.17C284.78 32.1 286.96 30.03 290.07 28.93C294.25 27.45 310.33 27.53 315.22 28.05C317.78 28.32 322.42 30 324.06 32.12L366.42 136.57C366.36 139.12 365 139.94 362.75 140.27C352.8 139.84 342.25 141.81 332.36 140.92C330.71 140.77 327.39 140.1 326.19 138.98L326.18 138.99ZM300.28 96.35C301.73 96.78 307.11 96.35 309.13 96.35C309.21 96.35 310.48 95.75 310.51 95.43C309.26 91.55 308.75 87.4 307.59 83.5C307.16 82.06 305.89 76.66 304.16 76.67L298.99 93.9C298.67 94.68 299.72 96.18 300.29 96.35H300.28Z" fill="#2D2218"/>
                                <path d="M180.93 19.31C205.77 17 231.86 31.95 238.09 58.13C247.07 95.86 235.87 132.7 195.14 137.77C165.7 141.44 139.93 128.2 133.27 96.6C125.71 60.74 143.59 22.79 180.93 19.31ZM183.11 62.09C177.75 63.24 170.82 74.21 170.53 79.63C170.13 86.99 176.38 92.76 182.71 94.66C187.71 96.15 191.89 96.86 195.93 92.86C206.93 81.95 201.28 58.19 183.12 62.09H183.11Z" fill="#2D2218"/>
                                <path d="M14.73 58.52C15.85 57.14 17.94 56.47 19.61 56.17C29.4 54.42 41.28 56.37 51.09 54.23C73.2 52.76 95.07 49.2 117.28 48.99C119.29 49.22 120.34 51.6 120.98 53.32C122.5 57.38 123.64 69.81 123.49 74.33C123.41 76.65 122.73 78.47 120.57 79.23C112.47 82.08 103.78 79.91 95.54 81.55C93.08 82.04 90.99 82.61 90.19 85.35L95.74 157.82C95.74 161.91 95.18 164.03 91.01 164.85C84.49 166.14 75.08 167.1 68.43 167.26C66.18 167.31 59.85 167.3 57.99 166.78C55.82 166.17 55.07 161.47 54.75 159.35C52.21 142.28 53.25 123.96 51.15 106.76L48.46 88.53C47.86 86.9 44.55 86.37 43.05 86.3C38.25 86.1 33.44 87.05 28.79 87.4C22.03 87.9 15.72 90.3 14.13 81.28C13.34 76.81 12.03 61.8 14.71 58.5L14.73 58.52Z" fill="#2D2218"/>
                                <path d="M586.94 67.74C586.15 68.24 580.86 68.46 579.57 68.42C573.28 68.23 567.2 66.12 560.88 66.1C556.62 66.09 554.84 66.3 554.01 70.95C550.41 90.92 550.94 114.43 548.16 134.98C547.83 137.43 547.24 141.92 546.71 144.08C545.5 149.01 539.12 146.95 535.66 146.88C530.15 146.77 524.57 146.77 519.05 145.95C516.73 145.61 511.17 144.7 509.31 143.83C507.18 142.84 506.77 140.35 506.74 138.11C506.46 118.39 511.74 94.47 512.66 74.12C512.74 72.35 512.91 65.81 512.58 64.69C511.66 61.52 503.43 61.46 500.78 61.13C499.71 61 498.68 60.32 497.52 60.2C491.76 59.61 480.27 62.45 480.12 53.12C480.05 49 481.02 38.83 481.95 34.84C482.97 30.46 484.98 28.21 489.37 28.11C499.28 27.86 511.18 32.15 521.25 31.6C541.27 33.89 561.47 33.73 581.32 37.16C583.21 37.49 585.68 37.23 587.36 37.74C590.29 38.62 590.56 46.07 590.51 48.78C590.44 52.35 589.63 66.04 586.94 67.74Z" fill="#2D2218"/>
                                <path d="M685.51 78.75C685.08 79.35 683.77 80.1 683.08 80.42C677.99 82.85 662.92 83.02 656.56 83.39C651.73 83.67 644.69 81.36 642.88 88.4C641.78 92.69 642.37 97.77 647.21 97.89C656.18 98.12 666.17 95.72 675.23 95.77C684.37 95.82 684.33 99.69 684.75 108.6C684.87 111.05 684.96 116.85 684.51 119.01C683.85 122.18 681.71 123.8 678.91 124.31C669.18 126.09 657.72 125.02 647.8 126.6C643.98 127.7 643.75 138.05 648.17 138.63C659.92 140.17 674.22 135.83 686.04 136.4C688.98 136.54 690.67 138.38 691.31 141.54C692.08 145.29 692.8 157.09 691.89 160.61C691.14 163.53 689.63 164.09 687.08 164.54C674.36 166.81 657.2 166.79 644.07 167.73C636.02 168.3 622 170.81 614.6 169.15C610.1 168.14 609.38 163.57 608.75 159.12C604.44 128.81 605.65 95.31 601.75 64.68C601.29 61.74 604.21 60.06 606.39 59.53C611.86 58.22 617.84 58.28 623.4 57.64C639.85 55.76 659.22 53.21 675.72 53.18C679.97 53.17 683.7 52.58 684.65 58.01C685.41 62.35 686.57 70.92 686.45 75.14C686.42 76.19 686.07 77.97 685.5 78.76L685.51 78.75Z" fill="#2D2218"/>
                                <path d="M632.68 45.66C638.45 44.81 669.42 40.39 673.81 37.45C674.4 37.05 675.52 36.17 675.85 35.5C676.28 34.62 676.41 32.7 676.33 31.58C675.98 27.08 674 18.04 672.84 13.48C671.39 7.78003 668.05 8.66002 664.18 8.97002C649.14 10.18 631.76 14.25 616.95 17.41C611.95 18.48 606.49 18.84 601.65 20.62C599.72 21.33 597.24 23.34 597.97 26.43L601.28 43.3C602.1 47.46 606.72 50.12 611.67 49.27L632.7 45.66H632.68Z" fill="#2D2218"/>
                                <path d="M731.86 54.97C730.28 54.97 728.8 54.58 727.3 54.28C725.8 53.98 724.27 53.7 722.85 53.11C721.43 52.52 720.13 51.7 718.85 50.84C717.57 49.98 716.38 49.04 715.28 47.94C714.18 46.84 713.12 45.75 712.26 44.46C711.4 43.17 710.83 41.76 710.23 40.32C709.63 38.88 709.08 37.49 708.77 35.95C708.46 34.41 708.48 32.94 708.48 31.36C708.48 29.78 708.57 28.28 708.86 26.79C709.17 25.25 709.61 23.81 710.2 22.39C710.79 20.97 711.54 19.63 712.39 18.35C713.24 17.07 713.82 15.51 714.92 14.42C716.02 13.33 717.35 12.43 718.63 11.57C719.91 10.71 721.47 10.37 722.91 9.76999C724.35 9.16999 725.74 8.65 727.27 8.34C728.8 8.03 730.27 7.76001 731.85 7.76001C733.43 7.76001 735 7.74001 736.49 8.04001C737.98 8.34001 739.5 8.89001 740.92 9.48001C742.34 10.07 743.88 10.6 745.16 11.46C746.44 12.32 747.47 13.58 748.56 14.67C749.65 15.76 750.8 16.85 751.67 18.14C752.54 19.43 753.34 20.79 753.94 22.23C754.54 23.67 754.73 25.23 755.03 26.77C755.33 28.31 755.47 29.8 755.47 31.38C755.47 32.96 755.49 34.53 755.19 36.02C754.89 37.51 754.16 38.96 753.57 40.37C752.98 41.78 752.38 43.24 751.52 44.52C750.66 45.8 749.88 47.22 748.79 48.32C747.7 49.42 746.41 50.38 745.12 51.24C743.83 52.1 742.44 52.88 741 53.48C739.56 54.08 737.98 54.16 736.44 54.47C734.9 54.78 733.43 54.98 731.85 54.98L731.86 54.97ZM731.86 15.17C730.42 15.17 728.94 15.13 727.6 15.49C726.26 15.85 724.93 16.59 723.72 17.29C722.51 17.99 721.27 18.81 720.28 19.8C719.29 20.79 718.41 21.98 717.7 23.2C716.99 24.42 716.55 25.8 716.18 27.17C715.82 28.5 715.46 29.92 715.46 31.37C715.46 32.82 715.78 34.25 716.14 35.58C716.5 36.91 716.93 38.37 717.63 39.58C718.33 40.79 719.29 41.94 720.29 42.93C721.29 43.92 722.45 44.82 723.67 45.53C724.89 46.24 726.23 46.82 727.61 47.19C728.99 47.56 730.41 47.19 731.85 47.19C733.29 47.19 734.66 47.16 735.99 46.8C737.32 46.44 738.86 46.28 740.06 45.58C741.26 44.88 742.39 43.89 743.39 42.9C744.39 41.91 745.16 40.68 745.87 39.45C746.58 38.22 746.95 36.88 747.32 35.5C747.69 34.12 747.96 32.8 747.96 31.35C747.96 29.9 747.52 28.58 747.16 27.25C746.8 25.92 746.55 24.48 745.85 23.27C745.15 22.06 744.13 21.06 743.14 20.06C742.15 19.06 741.02 18.29 739.8 17.58C738.58 16.87 737.42 16.09 736.04 15.72C734.66 15.35 733.3 15.15 731.85 15.15L731.86 15.17Z" fill="#2D2218"/>
                                <path d="M740.86 23.21C739.47 22.66 737.78 22.69 736.27 22.5C734.48 22.27 732.82 22.25 731.69 22.27C730.18 22.29 728.73 22.47 727.37 22.66C725.76 22.88 724.25 22.93 723.07 23.34C721.3 23.96 720.25 26.03 720.87 27.8C721.29 29.02 722.6 29.76 723.79 29.96C724.34 31.99 723.54 32.1 723.54 34.2C723.54 36.3 723.67 36.3 723.67 38.4C723.67 39.63 724.64 40.53 725.87 40.53C727.85 40.53 727.85 40.51 729.84 40.51C731.83 40.51 731.83 40.49 733.81 40.49C735.79 40.49 735.8 40.38 737.78 40.38C739.01 40.38 739.85 39.63 739.85 38.4C739.85 36.3 739.8 36.3 739.8 34.2C739.8 32.1 739.18 31.96 739.72 29.93C740.89 29.76 742.34 29.11 742.8 27.94C743.49 26.19 742.61 23.92 740.87 23.23L740.86 23.21Z" fill="#2D2218"/>
                            </svg>
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

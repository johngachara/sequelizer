const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
require('dotenv').config();
const {db} = require('../../firebase/firebase')

const completeRef = db.collection('complete_sales');

module.exports = router.get('/', async (req, res) => {
    try {
        // Get all documents from the 'complete' collection
        const snapshot = await completeRef.get();

        if (snapshot.empty) {
            return res.status(400).send('No items to send');
        }

        // Convert snapshot to array of data and calculate grand total
        const data = [];
        let grandTotal = 0;

        snapshot.forEach(doc => {
            const item = doc.data();
            data.push(item);
            grandTotal += item.selling_price;
        });

        // Create reusable transporter object using SMTP transport
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        // Generate the HTML content
        const generateHtml = (orders) => {
            let rows = orders.map(order => `
                <tr>
                    <td>${order.product_name}</td>
                    <td style="padding-left: 10px">${order.quantity}</td>
                    <td style="padding-left: 10px">${order.selling_price}</td>
                    <td style="padding-left: 10px">${order.selling_price * order.quantity}</td>
                </tr>
            `).join('');

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sold Accessories</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>Sold Accessories</h1>
                    <p>Here are Shop 2 purchased accessories this week</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Quantity</th>
                                <th>Selling Price</th>
                                <th>Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="3">Grand Total</th>
                                <th>${grandTotal}</th>
                            </tr>
                        </tfoot>
                    </table>
                    <p>Alltech</p>
                </body>
                </html>
            `;
        };

        let mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_RECEIVER,
            subject: 'Sold Accessories',
            html: generateHtml(data)
        };

        // Send mail with defined transport object
        let info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);

        // Delete all documents in the complete collection after sending
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        res.status(200).send('Complete orders sent successfully');
    } catch (e) {
        console.error("Error sending email:", e);
        res.status(500).send(e.message);
    }
});
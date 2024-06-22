const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
require('dotenv').config();
const complete = require('../models/complete')
const saveDB = require('../models/saved')
exports.sendComplete = router.get('/',async (req, res) => {
    try{
        const data = await complete.findAll()
       if(data.length === 0){
           return res.status(400).send('No items to send');
       }
       const grandTotal = data.reduce((total, item) => {
           return total + item.selling_price;
       },0)
        let mailTransporter =
            nodemailer.createTransport(
                {
                    service: 'gmail',
                    auth: {
                        user:process.env.GMAIL_USERNAME,
                        pass: process.env.GMAIL_PASSWORD
                    }
                }
            );
        // Generate the HTML content
        const generateHtml = (orders) => {
            let rows = orders.map(order => `
                <tr>
                    <td>${order.product_name}</td>
                    <td  style="margin-left: 10px">${order.quantity}</td>
                    <td  style="margin-left: 10px">${order.selling_price}</td>
                    <td  style="margin-left: 10px"> ${order.selling_price * order.quantity}</td>
                </tr>
            `).join('');

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sold Accessories</title>
                    <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css" rel="stylesheet">
                </head>
                <body>
                    <section class="section">
                        <div class="container">
                            <h1 class="title">Sold Accessories</h1>
                            <div class="content">
                                <p>Here are Shop 2 purchased accessories this week</p>
                                <table class="table is-striped">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th  style="margin-left: 20px">Quantity</th>
                                            <th  style="margin-left: 20px">Selling Price</th>
                                            <th  style="margin-left: 20px">Total Price</th>
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
                            </div>
                        </div>
                    </section>
                </body>
                </html>
            `;
        };

        let mailDetails = {

            from: process.env.GMAIL_USER,

            to: process.env. GMAIL_RECEIVER,

            subject: 'Sold Accessories',

            html: generateHtml(data)
        };
        await mailTransporter

            .sendMail(mailDetails,

                function (err, mail_data) {

                    if (err) {

                       return res.status(400).send(err.message)

                    } else {
                        complete.destroy({truncate:true})
                      return res.status(200).send('Complete orders sent successfully')

                    }

                });
    }catch(e){
        res.status(500).send(e.message)
    }
})
exports.sendIncomplete = router.post('/',async (req, res) => {
    try{
        const incompleteOrders = await saveDB.findAll()
        if(incompleteOrders.length === 0){
            return res.status(400).send('No items to send');
        }
        let mailTransporter =
            nodemailer.createTransport(
                {
                    service: 'gmail',
                    auth: {
                        user:process.env.GMAIL_USERNAME,
                        pass: process.env.GMAIL_PASSWORD
                    }
                }
            );
        // Generate the HTML content
        const incompleteHtml = (orders) => {
            let rows = orders.map(order => `
                <tr>
                    <td>${order.product_name}</td>
                    <td  style="margin-left: 20px">${order.quantity}</td>
                    <td  style="margin-left: 20px">${order.selling_price}</td>
                </tr>
            `).join('');

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Unpaid Accessories</title>
                    <link href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css" rel="stylesheet">
                </head>
                <body>
                    <section class="section">
                        <div class="container">
                            <h1 class="title">Unpaid Accessories</h1>
                            <div class="content">
                                <p>Here are Shop 2 unpaid accessories</p>
                                <table class="table is-striped">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th  style="margin-left: 20px">Quantity</th>
                                            <th  style="margin-left: 20px">Selling Price</th>
                             
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rows}
                                    </tbody>
                                    <tfoot>
                       
                                    </tfoot>
                                </table>
                   
                                <p>Alltech</p>
                            </div>
                        </div>
                    </section>
                </body>
                </html>
            `;
        };
        let mailDetails = {

            from: process.env.GMAIL_USER,

            to: process.env. GMAIL_RECEIVER,

            subject: 'Unpaid Accessories',

            html: incompleteHtml(incompleteOrders)
        };
        await mailTransporter

            .sendMail(mailDetails,

                function (err, mail_data) {

                    if (err) {

                        return res.status(400).send(err.message)

                    } else {
                        return res.status(200).send('Unpaid orders sent successfully')

                    }

                });
    }catch(e){
        res.status(500).send(e.message)
    }
})
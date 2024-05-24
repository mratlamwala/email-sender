const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const socketIo = require('socket.io');
const http = require('http')
const server = http.createServer(app)
const io = socketIo(server);
const path = require('path');
const { checkMXRecords } = require('./helper');

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('socket connected')
    socket.on('disconnect', () => console.log('disconnected from user'));
})

// Sample route to send bulk emails
app.post('/api/send-emails', async (req, res) => {

    const {emails, subject, body, from, password} = req.body

    let transporter

    try {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: from,
                pass: password,
            },
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;  
    let failedEmails = [];

    for (let i=0; i < emails.length; i++) {

        try {

            await checkMXRecords(emails[i]);

            await transporter.sendMail({
                to: emails[i],
                from: from,
                subject: subject,
                html: body,
            })

            totalEmailsSent += 1;
            io.emit('emailProgress', { sent: totalEmailsSent, failed: totalEmailsFailed, failedEmails, total: emails.length });
        } catch (error) {
            console.log('error', error.responseCode)
            if (error.responseCode === 535) {
                return res.status(400).json({
                    success: false,
                    message: "Email or Password is invalid!"
                });
            } else {
                totalEmailsFailed += 1;
                failedEmails.push(emails[i]);
                io.emit('emailProgress', { sent: totalEmailsSent, failed: totalEmailsFailed, failedEmails, total: emails.length });
            }
        }   
    }

    res.json({
        success: true,
        message: 'Emails sent successfully!',
        totalEmailsSent,
        totalEmailsFailed
    })

});

server.listen(4000, () => console.log('server is up!!!!!'))
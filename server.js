const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
const socketIo = require('socket.io');
const http = require('http')
const server = http.createServer(app)
const io = socketIo(server);
const path = require('path');
const { checkMXRecords } = require('./helper');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('socket connected')
    socket.on('disconnect', () => console.log('disconnected from user'));
})

app.get('/extract', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'extract-emails', 'index.html'))
})

app.post('/upload', upload.array('pdfs'), async (req, res) => {
    try {
        const files = req.files;
        let emails = [];

        let count = 0;
        for (const file of files) {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            const emailMatches = data.text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g);
            if (emailMatches) {
                emails = emails.concat(emailMatches);
            }
            fs.unlinkSync(file.path); // delete the file after processing

            count++;
            io.emit('pdfUpload', { uploaded: count, total: files.length });
        }

        res.json({ emails: [...new Set(emails)] }); // return unique emails
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing files');
    }
});


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

const port = process.env.PORT || 4000;

server.listen(port, () => console.log('server is up!!!!!'))
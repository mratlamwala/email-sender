const emailsAndPasswords = [
    { id: "2", email: "publishjournal8@gmail.com", password: "uzci jjsf mobj lgqn" },
    { id: "1", email: "journalresearch78@gmail.com", password: "zyun yyqn blzh ijqm" },
    { id: "3", email: "journal.publish.article@gmail.com", password: "bjir eexi nkwl gwey" },
    { id: "4", email: "research.journal.publish@gmail.com", password: "ydmc nayb ncjq qukr" },
]

document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('emailForm');
    const status = document.getElementById('status');
    const alert = document.getElementById('alert');
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressBar = document.getElementById('progressBar');
    const progressBarMessage = document.getElementById('progressBarMessage');
    const failedEmailsList = document.getElementById('failedEmailsList');
    const failedEmailsWrapper = document.getElementById('failedEmailsWrapper');
    const emailSelect = document.getElementById('emailSelect');
    const emailsTextArea = document.getElementById('emails');
    const contentTextArea = document.getElementById('content');
    const submitButton = document.getElementById('sendButton');
    const clearButtons = document.querySelectorAll('.clear-button');
    const clearFormButton = document.getElementById('clearButton');
    const socket = io();

    const clearInput = (inputId) => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    }

    clearButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputId = button.dataset.input;
            clearInput(inputId);
        });
    });

    emailsAndPasswords.forEach(e => {
        const option = document.createElement('option');
        option.value = e.id;
        option.innerText = e.email;
        emailSelect.appendChild(option)
    })

    const updateProgressBar = (current, total) => {
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBarMessage.textContent = `${Math.round(percentage)}%`;

        const red = Math.floor((100 - percentage) * 2.55);
        const green = Math.floor(percentage * 2);
        progressBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`;
    }

    const reset = () => {
        status.innerHTML = '';
        alert.innerHTML = '';
        failedEmailsList.innerHTML = '';
        failedEmailsWrapper.style.display = 'none';
        progressBarContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressBarMessage.textContent = '';
    }

    socket.addEventListener('emailProgress', (data) => {
        progressBarContainer.style.display = "block"
        failedEmailsWrapper.style.display = "none";
        status.innerHTML = `
            <p style="color: green">Sent ${data.sent} out of ${data.total}</p>
            <p style="color: red">Failed ${data.failed} out of ${data.total}</p>
        `

        if (data.failedEmails?.length) {
            failedEmailsWrapper.style.display = "block";
            failedEmailsList.innerHTML = "";
            data.failedEmails.forEach(email => {
                const li = document.createElement('li')
                li.innerText = email;
                failedEmailsList.appendChild(li)
            });
        }

        const totalSent = data.sent + data.failed;
        if (totalSent === data.total) {
            progressBarMessage.textContent = "All Emails are sent!"
        }
        updateProgressBar(totalSent, data.total);
        window.scrollTo(0, document.body.scrollHeight);
    })

    let selectedEmail;

    emailSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        selectedEmail = emailsAndPasswords.find(e => e.id === value);
    })

    const changeHeightOnInput = e => {
        e.target.style.height = 'auto'; // Reset height to auto
        e.target.style.height = e.target.scrollHeight + 'px'; // Set height to scrollHeight
    }

    emailsTextArea.addEventListener('input', changeHeightOnInput);
    contentTextArea.addEventListener('input', changeHeightOnInput);

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        reset()
        submitButton.innerText = "Sending...";
        submitButton.disabled = true;
        const form = new FormData(e.target);
        const email = selectedEmail.email;
        const password = selectedEmail.password;
        const subject = form.get('subject');
        const content = form.get('content');
        const emails = form.get('emails').split('\n').map(email => email.trim());

        try {
            const response = await fetch('/api/send-emails', {
                method: "POST",
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify({ emails, subject, body: content, from: email, password })
            });
            const res = await response.json();
            console.log('res', res)
            if (res.success) {
                alert.innerHTML = "Emails sending completed!";
                alert.style.color = "green";
            } else {
                alert.innerHTML = res.message;
                alert.style.color = "red";
            }
        } catch (error) {
            alert.innerHTML = "Failed to Send emails!";
            alert.style.color = "red";
        } finally {
            submitButton.innerText = "Send Emails";
            submitButton.disabled = false;
        }
    });

    clearFormButton.addEventListener('click', () => {
        emailForm.reset(); 
        reset();
    });
});
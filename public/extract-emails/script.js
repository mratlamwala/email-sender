document.addEventListener('DOMContentLoaded', () => {
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressBar = document.getElementById('progressBar');
    const progressBarMessage = document.getElementById('progressBarMessage');
    const socket = io();

    socket.addEventListener('pdfUpload', (data) => {
        progressBarContainer.style.display = "block"

        if (data.uploaded === data.total) {
            setTimeout(() => {
                progressBarContainer.style.display = "none"
            }, 500)
        }

        updateProgressBar(data.uploaded, data.total);
    })

    const updateProgressBar = (current, total) => {
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressBarMessage.textContent = `${Math.round(percentage)}%`;

        const red = Math.floor((100 - percentage) * 2.55);
        const green = Math.floor(percentage * 2);
        progressBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`;
    }

    document.getElementById('upload-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData();
        const files = document.getElementById('pdfs').files;
        for (let i = 0; i < files.length; i++) {
            formData.append('pdfs', files[i]);
        }

        const uploadButton = document.querySelector('#upload-form button[type="submit"]');
        uploadButton.disabled = true;
        uploadButton.textContent = 'Uploading...';

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            displayEmails(result.emails);
        } catch (error) {
            console.error('Error uploading files:', error);
        } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload and Extract Emails';
        }
    });

    function displayEmails(emails) {
        const emailList = document.getElementById('email-list');
        const emailCount = document.getElementById('email-count');
        emailList.innerHTML = '';
        emails.forEach(email => {
            const li = document.createElement('li');
            li.textContent = email;
            emailList.appendChild(li);
        });
        emailCount.textContent = `Total emails extracted: ${emails.length}`;

        const copyButton = document.getElementById('copy-emails');
        if (emails.length > 0) {
            copyButton.style.display = 'block';
            copyButton.onclick = () => copyEmailsToClipboard(emails, copyButton);
        } else {
            copyButton.style.display = 'none';
        }
    }

    function copyEmailsToClipboard(emails, button) {
        const emailString = emails.join('\n');
        navigator.clipboard.writeText(emailString).then(() => {
            button.textContent = 'Copied!';
            button.style.backgroundColor = '#28a745';
            setTimeout(() => {
                button.textContent = 'Copy All!';
                button.style.backgroundColor = '#007BFF';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy emails: ', err);
        });
    }

    document.getElementById('reset-form-btn').addEventListener('click', function (event) {
        event.preventDefault();
    
        document.getElementById('pdfs').value = '';
    
        document.getElementById('email-list').innerHTML = '';
        document.getElementById('email-count').textContent = '';
    
        document.getElementById('copy-emails').style.display = 'none';
    });

});
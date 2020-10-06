document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => send_email();
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show emails
  const emails_view = document.querySelector('#emails-view');
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        var emails_container = document.createElement('div');
        var email_sender = document.createElement('div');
        var email_subject = document.createElement('div');
        var email_timestamp = document.createElement('div');

        emails_container.classList.add('row', 'border', 'border-dark', 'my-2', 'py-2');
        email_sender.classList.add('col-md-3', 'col-sm-6', 'overflow-hidden');
        email_subject.classList.add('col-md-6', 'col-sm-6', 'overflow-hidden');
        email_timestamp.classList.add('col-md-3', 'col-sm-6', 'overflow-hidden', 'd-flex', 'justify-content-end');

        email.recipients.forEach(recipient => {
          var recipients_div = document.createElement('div');
          recipients_div.classList.add('row', 'mx-0');
          recipients_div.innerHTML = mailbox === 'sent' ? `To: ${recipient}` : email.sender;
          email_sender.appendChild(recipients_div)
        });

        email_subject.innerHTML = email.subject;
        email_timestamp.innerHTML = email.timestamp;

        emails_container.appendChild(email_sender);
        emails_container.appendChild(email_subject);
        emails_container.appendChild(email_timestamp);
        emails_view.appendChild(emails_container);
      });
    });
}

function send_email() {
  const compose_recipients = document.querySelector('#compose-recipients');
  const compose_subject = document.querySelector('#compose-subject');
  const compose_body = document.querySelector('#compose-body');

  console.log(compose_recipients.value);
  console.log(compose_subject.value);
  console.log(compose_body.value);

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: compose_recipients.value,
      subject: compose_subject.value,
      body: compose_body.value
    })
  })
    .then(response => response.json())
    .then(result => {
      alert(Object.values(result))
      load_mailbox('sent');
    });
  return false;
}

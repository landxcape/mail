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
  document.querySelector('#read-view').style.display = 'none';

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
  document.querySelector('#read-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  // Show emails
  const emails_view = document.querySelector('#emails-view');
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const emails_link = document.createElement('a');
        const emails_container = document.createElement('div');
        const email_sender = document.createElement('div');
        const email_subject = document.createElement('div');
        const email_timestamp = document.createElement('div');

        emails_container.classList.add('row', 'border', 'border-dark', 'my-2', 'py-2');
        email_sender.classList.add('col-md-3', 'col-sm-6', 'overflow-hidden');
        email_subject.classList.add('col-md-6', 'col-sm-6', 'overflow-hidden');
        email_timestamp.classList.add('col-md-3', 'col-sm-6', 'overflow-hidden', 'd-flex', 'justify-content-end');

        email.recipients.forEach(recipient => {
          let recipients_div = document.createElement('div');
          recipients_div.classList.add('row', 'mx-0');
          recipients_div.innerHTML = mailbox === 'sent' ? `To: ${recipient}` : email.sender;
          email_sender.appendChild(recipients_div)
        });

        email_subject.innerHTML = email.subject;
        email_timestamp.innerHTML = email.timestamp;
        emails_link.onclick = () => view_email(email.id);

        emails_container.appendChild(email_sender);
        emails_container.appendChild(email_subject);
        emails_container.appendChild(email_timestamp);
        emails_container.style.background = email.read ? 'LightGray' : 'white';
        emails_link.appendChild(emails_container)
        emails_view.appendChild(emails_link);
      });
    });

  document.querySelector('#read-view').onsubmit = (email_id) => view_email(email_id);
  return false;
}

function send_email() {
  const compose_recipients = document.querySelector('#compose-recipients');
  const compose_subject = document.querySelector('#compose-subject');
  const compose_body = document.querySelector('#compose-body');

  const csrftoken = getCookie('csrftoken');

  fetch('/emails', {
    headers: { 'X-CSRFToken': csrftoken },
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

function view_email(email_id) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';

  const view_from = document.querySelector('#view-from');
  const view_to = document.querySelector('#view-to');
  const view_subject = document.querySelector('#view-subject');
  const view_timestamp = document.querySelector('#view-timestamp');
  const view_body = document.querySelector('#view-body');
  const button_archive = document.querySelector('#email-archive');
  const button_reply = document.querySelector('#email-reply');

  const csrftoken = getCookie('csrftoken');

  let email_archive;
  let email_content;

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      email_content = email;
      let button_show = email.sender === document.querySelector('h2').innerText ? 'none' : 'block';
      button_archive.style.display = button_show;
      button_reply.style.display = button_show;

      view_from.innerHTML = email.sender;
      while (view_to.firstChild) {
        view_to.removeChild(view_to.firstChild);
      }
      email.recipients.forEach((recipient) => {
        const to_row = document.createElement('div');
        to_row.classList.add('row', 'mx-0');
        to_row.innerHTML = recipient;
        view_to.appendChild(to_row);
      });
      view_subject.innerHTML = email.subject;
      view_timestamp.innerHTML = email.timestamp;
      view_body.innerHTML = email.body.replace(/\n/g, '<br>');


      email_archive = email.archived;
      button_archive.innerHTML = email_archive ? 'Unarchive' : 'Archive';
    });

  fetch(`/emails/${email_id}`, {
    headers: { 'X-CSRFToken': csrftoken },
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

  button_archive.onclick = () => {
    fetch(`/emails/${email_id}`, {
      headers: { 'X-CSRFToken': csrftoken },
      method: 'PUT',
      body: JSON.stringify({
        archived: !email_archive
      })
    }).then(
      () => load_mailbox('inbox')
    )
  };

  button_reply.onclick = () => {
    compose_email();
    let sender_string = email_content.sender;
    let subject_string = email_content.subject;
    let body_string = `\n\n\nOn ${email_content.timestamp} ${sender_string} wrote:\n${email_content.body}\n\n\n`

    document.querySelector('#compose-recipients').value = sender_string;
    document.querySelector('#compose-subject').value = subject_string.includes('Re:') ? subject_string : `Re: ${subject_string}`;
    document.querySelector('#compose-body').value = body_string;

  };

  return false;
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
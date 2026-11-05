// Généré par tools/build-pages.rb. Dessine les monuments et envoie le formulaire de contact.
(function () {
  if (window.Sprites) document.querySelectorAll('img[data-sprite]').forEach(function (img) {
    var id = img.dataset.sprite, meta = Sprites.meta(id), zoom = +img.dataset.zoom || 2;
    if (!meta) return;
    img.width = meta.w * zoom; img.height = meta.h * zoom; img.src = Sprites.url(id, 0);
  });
  var form = document.getElementById('contact-form');
  if (!form) return;
  var out = document.getElementById('contact-out'), send = form.querySelector('button');
  var say = function (cls, msg) { out.className = cls; out.textContent = msg; };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.website.value) return;  // case invisible, remplie seulement par les robots
    send.disabled = true; say('', 'Envoi en cours…');
    fetch("https://soiifvmqrqzpvzdajhpj.supabase.co" + '/rest/v1/rpc/contact_send', {method: 'POST',
      headers: {apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvaWlmdm1xcnF6cHZ6ZGFqaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MjY3MDcsImV4cCI6MjEwOTQwMjcwN30.BhYZ_GiP1-7xS7iRAUPpcp1wI4n8yeTg5fURblLAgXo", Authorization: 'Bearer ' + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvaWlmdm1xcnF6cHZ6ZGFqaHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MjY3MDcsImV4cCI6MjEwOTQwMjcwN30.BhYZ_GiP1-7xS7iRAUPpcp1wI4n8yeTg5fURblLAgXo", 'Content-Type': 'application/json'},
      body: JSON.stringify({p_topic: form.topic.value, p_body: form.body.value.trim(), p_reply: form.reply.value.trim() || null})
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.reset(); say('ok', 'Message envoyé, merci !');
      if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) fetch("https://ntfy.sh/monuments-7908daac2a57", {method: 'POST', body: '📨 Nouveau message sur la page Contact', keepalive: true}).catch(function () {});
    }).catch(function () {
      say('ko', 'Impossible d’envoyer le message pour le moment. Réessaie un peu plus tard.');
    }).then(function () { send.disabled = false; });
  });
})();

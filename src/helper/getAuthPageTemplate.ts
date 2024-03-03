export function getAuthPageTemplate(
    title: string,
    imgUrl: string,
    message: string,
    info: string,
    closeTime: number,
    closeMessage: string
) {
    const template = ` 
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: white;
        }

        .container {
          text-align: center;
        }

        img {
          max-width: 100%;
          height: 40%;
          display: block;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src=${imgUrl} alt="Image" />
        <p
          style="
            font-family: sans-serif;
            font-size: x-large;
            font-weight: lighter;
          "
        >
        ${message}
        </p>
        <p
          style="
            font-family: sans-serif;
            font-size: smaller;
            color: #85888d;
          "
        >
          ${info}
        </p>
        <p style="
            font-family: sans-serif;
            font-size: smaller;
            color: #85888d;"
            class="countdown" id="countdown">
          </p>
        </div>

        <script>
          let seconds = ${closeTime};
          const countdownElement = document.getElementById('countdown');

          const countdown = setInterval(function() {
            countdownElement.textContent = '${closeMessage}'.replace('{seconds}', seconds) + ' second(s)';
            seconds--;

            if (seconds < 0) {
              clearInterval(countdown);
              window.close();
            }
          }, 1000);
        </script>
    </body>
    </html>
    `;

    return template;
}

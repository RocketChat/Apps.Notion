export function getAuthPageTemplate(
    type: string,
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
      <link rel="icon" sizes="16x16" type="image/png" href=/assets/favicon_16.png />
			<link rel="icon" sizes="32x32" type="image/png" href=/assets/favicon_32.png />
			<link rel="icon" sizes="any" type="image/svg+xml" href=/assets/favicon.svg />
      <style>
        body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-image: url('data:image/svg+xml,%3Csvg%20width%3D%221440%22%20height%3D%22896%22%20viewBox%3D%220%200%201440%20896%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20clip-path%3D%22url(%23clip0)%22%3E%3Crect%20width%3D%221440%22%20height%3D%22896%22%20fill%3D%22white%22%3E%3C%2Frect%3E%3Crect%20width%3D%221440%22%20height%3D%22901%22%20transform%3D%22translate(0%20-5)%22%20fill%3D%22%232F343D%22%3E%3C%2Frect%3E%3Cg%20opacity%3D%220.3%22%3E%3Cpath%20d%3D%22M551.144%20637.885C277.724%20530.833%20142.855%20222.4%20249.907%20-51.0195%22%20stroke%3D%22url(%23paint0_linear)%22%20stroke-width%3D%224.03643%22%20stroke-linecap%3D%22round%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M1123.26%20-80.3291C1246.5%20128.592%201177.04%20397.86%20968.123%20521.1C759.202%20644.339%20489.933%20574.881%20366.694%20365.96%22%20stroke%3D%22url(%23paint1_linear)%22%20stroke-width%3D%224.03643%22%20stroke-linecap%3D%22round%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M1250.77%20-155.546C1415.55%20123.797%201322.68%20483.829%201043.34%20648.61C763.997%20813.39%20403.964%20720.519%20239.184%20441.176%22%20stroke%3D%22url(%23paint2_linear)%22%20stroke-width%3D%224.03643%22%20stroke-linecap%3D%22round%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M1103.1%20749.926C767.806%20947.713%20335.655%20836.239%20137.868%20500.941C-59.9195%20165.643%2051.5547%20-266.508%20386.852%20-464.295%22%20stroke%3D%22url(%23paint3_linear)%22%20stroke-width%3D%224.03643%22%20stroke-linecap%3D%22round%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M1073.04%20710.149C1385.7%20529.633%201492.83%20129.834%201312.31%20-182.829C1131.8%20-495.491%20731.996%20-602.617%20419.333%20-422.101%22%20stroke%3D%22url(%23paint4_linear)%22%20stroke-width%3D%224.03643%22%20stroke-linecap%3D%22round%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M1211.56%20-179.617C1386.57%2075.0193%201319.19%20425.259%201061.06%20602.665%22%20stroke%3D%22%23F2F3F5%22%20stroke-width%3D%224.03643%22%20stroke-linecap%3D%22round%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fg%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22paint0_linear%22%20x1%3D%22152.99%22%20y1%3D%22196.516%22%20x2%3D%22648.061%22%20y2%3D%22390.349%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%231D74F5%22%3E%3C%2Fstop%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231D74F5%22%20stop-opacity%3D%220%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22paint1_linear%22%20x1%3D%22744.978%22%20y1%3D%22142.815%22%20x2%3D%22968.123%22%20y2%3D%22521.1%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23CBCED1%22%3E%3C%2Fstop%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23CBCED1%22%20stop-opacity%3D%220%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22paint2_linear%22%20x1%3D%22744.978%22%20y1%3D%22142.815%22%20x2%3D%221043.34%22%20y2%3D%22648.61%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23FFD031%22%3E%3C%2Fstop%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23FFD031%22%20stop-opacity%3D%220%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22paint3_linear%22%20x1%3D%2283.2972%22%20y1%3D%22-285.232%22%20x2%3D%22799.549%22%20y2%3D%22928.988%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23CBCED1%22%3E%3C%2Fstop%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23CBCED1%22%20stop-opacity%3D%220%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22paint4_linear%22%20x1%3D%22702.396%22%20y1%3D%22-585.527%22%20x2%3D%221356.1%22%20y2%3D%22546.723%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%234EBE8C%22%3E%3C%2Fstop%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%234EBE8C%22%20stop-opacity%3D%220%22%3E%3C%2Fstop%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22clip0%22%3E%3Crect%20width%3D%221440%22%20height%3D%22896%22%20fill%3D%22white%22%3E%3C%2Frect%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E');
          background-repeat: no-repeat;
          background-size: cover;
        }

        .container {
          text-align: center;
        }

        img {
          max-width: 100%;
          ${type === "failure" ? "max-height:2.5rem;": "max-height:6rem;"}
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
            font-weight: 800;
            color:#FFFFFF;
          "
        >
        ${message}
        </p>
        <p
          style="
            font-family: sans-serif;
            font-size: smaller;
            color:#FFFFFF;
          "
        >
          ${info}
        </p>
        <p style="
            font-family: sans-serif;
            font-size: smaller;
            color:#FFFFFF;
            class="countdown" id="countdown">
            Window will be closed in 5 second(s)
          </p>
        </div>

        <script>
          let seconds = ${closeTime};
          const countdownElement = document.getElementById('countdown');

          const countdown = setInterval(function() {
       
            if (seconds < 1) {
              clearInterval(countdown);
              window.close();
            }
            
            countdownElement.textContent = '${closeMessage}'.replace('{seconds}', seconds) + ' second(s)';
            seconds--;
          }, 1000);
        </script>
    </body>
    </html>
    `;

    return template;
}

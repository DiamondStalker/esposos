import { useEffect, useRef } from 'react';

// Inyecta el iframe API de Spotify y arma el reproductor embebido en
// #spotify-embed-container. Expone play()/markUserAccepted() para que el
// popup de bienvenida pueda arrancar la música tras el gesto del usuario.
export default function useSpotifyEmbed() {
  const controllerRef = useRef(null);
  const userAcceptedRef = useRef(false);

  useEffect(() => {
    if (document.getElementById('spotify-iframe-script')) return;

    const script = document.createElement('script');
    script.id = 'spotify-iframe-script';
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);

    let embedController = null;

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      const element = document.getElementById('spotify-embed-container');
      if (!element) return;

      const options = {
        uri: 'spotify:playlist:0rHcsnXMIQjMNPzUmQfK2Z',
        width: '100%',
        height: '352',
      };

      IFrameAPI.createController(element, options, (EmbedController) => {
        embedController = EmbedController;
        controllerRef.current = EmbedController;

        EmbedController.addListener('ready', () => {
          if (userAcceptedRef.current) {
            EmbedController.play();
          }
        });
      });
    };

    return () => {
      if (embedController) {
        embedController.destroy?.();
      }
    };
  }, []);

  return {
    play: () => controllerRef.current?.play(),
    markUserAccepted: () => {
      userAcceptedRef.current = true;
    },
  };
}

import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import Carousel from 'react-bootstrap/Carousel';

export default function App() {
    const importAll = (r) => {
        return r.keys().map(r);
    };

    const images = importAll(require.context('../assets/img', false, /\.(png|jpe?g|svg)$/));
    console.log(images);

    return (
        <div>
            <h4>Nuestras Aventuras</h4>
            <Carousel>
                {images.map((img, index) => (
                    <Carousel.Item key={index}>
                        <div className="carousel-image-container">
                            <img
                                src={img}
                                alt={`Aventura ${index + 1}`} // Alt text for accessibility
                                className="carousel-image"
                            />
                        </div>
                    </Carousel.Item>
                ))}
            </Carousel>
        </div>
    );
}

import ShootingStarsBackground from './ShootingStarsBackground';
import StarFieldBackground from './StarFieldBackground';

const RandomBackground = () => {
    const backgrounds = [<ShootingStarsBackground key="shooting"/>, <StarFieldBackground key="stars"/>];

    const randomIndex = Math.floor(Math.random() * backgrounds.length);

    return backgrounds[randomIndex];
};

export default RandomBackground;
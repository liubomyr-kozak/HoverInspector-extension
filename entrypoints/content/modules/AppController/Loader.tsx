// Loader.tsx
import React from 'react';
import styled, {keyframes} from 'styled-components';

// Анімація для стрибка стовпчика
const bounce = keyframes`
    0%, 100% {
        transform: scaleY(1);
    }
    50% {
        transform: scaleY(1.4);
    }
`;

// Анімація для зміни кольору (блакитний → жовтий → чорний → червоний)
const colorChange = keyframes`
    0% {
        background: #1890ff;
    }
    40% {
        background: #ffe066;
    }
    50% {
        background: #000000;
    }
    70% {
        background: #ff3b3b;
    }
    100% {
        background: #1890ff;
    }
`;


const BarsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
`;

const Bar = styled.div<{ delay: number }>`
    width: 8px;
    height: 100%;
    margin: 0 4px;
    border-radius: 4px;
    // Дві анімації: bounce (стрибок) та colorChange (зміна кольору)
    animation: ${bounce} 0.4s infinite, // стрибкова анімація, швидко повторюється
    ${colorChange} 1.5s infinite; // анімація зміни кольору, цикл триває 1.5 секунди
    animation-delay: ${props => props.delay}s, // індивідуальна затримка для bounce, щоб хвиля була "живою"
    ${props => props.delay * 1.4}s; // більша затримка для colorChange, щоб кольори не збігалися
`;

const Loader: React.FC = () => (
    <BarsWrapper>
        <Bar delay={0}/>
        <Bar delay={0.08}/>
        <Bar delay={0.16}/>
        <Bar delay={0.32}/>
        <Bar delay={0.48}/>
    </BarsWrapper>
);

export default Loader;

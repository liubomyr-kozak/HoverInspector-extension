import React from 'react';
import './launcher-icon.scss';

const launcherMatrix = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
];
const launcherMatrixHtml = launcherMatrix.map((item, index) => {
    return (
        <div key={index} className="wb-launcher-icon-row">{
            item.map((subItem, subIndex) =>
                <div key={subIndex} id={'rect' + subIndex} className="wb-launcher-icon-cell"/>
            )
        }</div>
    )
});

const LauncherIcon = ({isLauncherVisible, toggleVisible}) => {
    return (
        <div
            className={`wb-launcher-icon ${isLauncherVisible ? 'wb-show-launcher' : 'wb-hide-launcher'}`}
            onClick={toggleVisible}>
            <div className="wb-launcher-icon-label">W</div>
            {launcherMatrixHtml}
        </div>
    )
};

export default LauncherIcon
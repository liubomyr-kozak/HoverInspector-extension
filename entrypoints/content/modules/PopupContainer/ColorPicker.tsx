import {useState, useEffect} from 'react';
import BestColorPicker from 'react-best-gradient-color-picker'
import styled from "styled-components";
import {useSelector, useDispatch} from "react-redux";
import {FeatureTitle} from "@entrypoints/content/modules/PopupContainer/PopupContainer.styled.ts";
import {BetaBadge} from "@entrypoints/shared/components/BetaBadge.tsx";
import {addColorToHistory} from "@entrypoints/content/store/app/app.slice.ts";
import { IconHistory } from "@tabler/icons-react";


const Container = styled.div`
    position: relative;
`;

const PickerWrapper = styled.div`
    //position: absolute;
    //top: 0;
    //left: 0;

    overflow-x: auto;
`;

const HistoryContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
    margin-bottom: 16px;
`;

const ColorHistoryItem = styled.div<{ color: string }>`
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: ${props => props.color};
    cursor: pointer;
    border: 1px solid #ccc;
    transition: transform 0.2s;
    
    &:hover {
        transform: scale(1.1);
    }
`;

const HistoryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    margin-left: auto;
    transition: background-color 0.2s;
    
    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    
    &:active {
        background-color: rgba(0, 0, 0, 0.1);
    }
`;

const TitleRow = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 8px;
`;

const ColorPicker = () => {
    const [color, setColor] = useState('rgba(255,255,255,1)');
    const [showHistory, setShowHistory] = useState(false);
    const dispatch = useDispatch();
    
    // Get color history from Redux store
    const colorHistory = useSelector((state: any) => state?.app.colorHistory || []);
    console.log("🌟🌟🌟 ::ColorPicker -> colorHistory", colorHistory);
    
    const featurePopupPosition = useSelector(
        (state: any) => state?.app.featurePopupPosition
    );
    
    // Add color to history when it changes
    useEffect(() => {
        if (color) {
            dispatch(addColorToHistory(color));
        }
    }, [color, dispatch]);
    
    // Handle selecting a color from history
    const handleSelectHistoryColor = (historyColor: string) => {
        setColor(historyColor);
    };
    
    // Toggle history visibility
    const toggleHistory = () => {
        setShowHistory(!showHistory);
    };

    return (
        <Container>
            <TitleRow>
                <FeatureTitle>
                    Color Picker
                    <BetaBadge>Beta</BetaBadge>
                    {colorHistory.length > 0 && (
                        <HistoryButton
                            onClick={toggleHistory}
                            title="Color History"
                            style={{ position: 'relative' }}
                        >
                            <IconHistory size={20} color={showHistory ? "#4CAF50" : "#666"} />
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: '#4CAF50',
                                color: 'white',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                            {colorHistory.length}
                        </span>
                        </HistoryButton>
                    )}
                </FeatureTitle>

            </TitleRow>
            
            {/* Display color history if there are any saved colors and showHistory is true */}
            {colorHistory.length > 0 && showHistory && (
                <>
                    <div style={{ marginTop: '8px', marginBottom: '4px', fontSize: '14px' }}>
                        Recently used colors:
                    </div>
                    <HistoryContainer>
                        {colorHistory.map((historyColor: string, index: number) => (
                            <ColorHistoryItem 
                                key={index} 
                                color={historyColor} 
                                onClick={() => handleSelectHistoryColor(historyColor)}
                                title={historyColor}
                            />
                        ))}
                    </HistoryContainer>
                </>
            )}

            <PickerWrapper>
                <BestColorPicker
                    value={color} 
                    onChange={setColor}
                    width={featurePopupPosition.width - 32 /* padding */ - 15  /* something else */}
                    height={200}
                />
            </PickerWrapper>
        </Container>
    )
};

export default ColorPicker;

import React, {useEffect, useState} from 'react';
import {getWordTranslationFromAPI} from '../../../API/googleAPI'
import './search-box.scss';
import {useStateAppValue} from "../../../app-context";

export const SearchBox = () => {
    const [isSectionActive, setToggleSectionActive] = useState(false);
    const [searchFilterInput, setSearchFilterInput] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [state, dispatch] = useStateAppValue();

    const debouncedSearchTerm = useDebounce(searchFilterInput, 500);

    let wrapperRef = null;
    const setWrapperRef = (node) => {
        wrapperRef = wrapperRef || node;
    };

    const handleClickOutside = (event) => {
        const toggleShow = wrapperRef && wrapperRef.contains(event.target);
        setToggleSectionActive(toggleShow);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, []);


    useEffect(() => {
        if (!debouncedSearchTerm) {
            clearSearchStates();
            return
        }
        getWordTranslationFromAPI(searchFilterInput, setSearchResult)
    }, [debouncedSearchTerm]);

    const onSelectSearchWord = (wordData) => {
        dispatch({type: 'addWord', wordData});
        clearSearchStates();
    };

    const clearSearchStates = () => {
        setSearchResult(null);
        setSearchFilterInput('');
    };

    const getTranslationCard = (wordData) => {
        return (
            <div className="wb-searchbox-result">
                <div className="wb-searchbox-result-item flex center" onClick={e => {
                    onSelectSearchWord(wordData)
                }}>
                    {wordData.fistTransation.trans}
                    <br/>
                    {wordData.succeeded ?
                        wordData.translation && wordData.translation.map(trans => {

                        })
                        : wordData.translation
                    }
                </div>
            </div>
        )
    };

    const searchResultEl = () => {
        return searchResult && isSectionActive
            ? getTranslationCard(searchResult)
            : ''
    };

    return (
        <div ref={setWrapperRef} className="wb-searchbox flex">
            <div
                className={`wb-searchbox-container ${isSectionActive ? 'wb-searchbox-is-active' : ''} flex flex-column`}>
                <div className="flex align-center">
                    <input className="wb-searchbox-search-input" type="text"
                           placeholder="filter or search"
                           value={searchFilterInput}
                           onChange={({target: {value}}) => setSearchFilterInput(value)}/>
                    <span className="btn btn-transp wb-searchbox-search-btn flex align-center">
                        <i className="material-icons">search</i>
                    </span>
                </div>

                {searchResultEl()}
            </div>
        </div>
    )
};


function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);
            return () => {
                clearTimeout(handler);
            };
        },
        [value]
    );

    return debouncedValue;
}
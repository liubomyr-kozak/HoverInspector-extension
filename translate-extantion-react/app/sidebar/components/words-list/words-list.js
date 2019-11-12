import React, {useState} from 'react';

// import './words-list-v2.scss';

import {useStateAppValue} from '../../../app-context'

const WordCard = ({word}) => {
    const [isOptionSectionOpen, toggleVisibilityOptionSection] = useState(false);

    const toggleViabilityOptionSection = () => {
        toggleVisibilityOptionSection(!isOptionSectionOpen)
    };

    return (
        <div className="wb-word-item">
            <div className="wb-word-item-main-desc">
                <i className="material-icons mr-10 curs-pointer">volume_up</i>
                {word.word} -  <b>{word.fistTransation.trans}</b>
                <i className="material-icons wb-delete-btn-word-card">delete</i>
            </div>
            {word.translation.map((s, key) => (
                <div key={key}>
                    <span className="wb-word-grammar-def">{s.pos}</span>
                    {s.meanings.join(', ')}
                </div>
            ))}

            <div className="text-right">
                <span className="btn-search-more-btn" onClick={toggleViabilityOptionSection}>
                    more
                    <i className="material-icons">expand_more</i>
                </span>
            </div>

            <div className={`btn-search-more-group ${isOptionSectionOpen && 'is-opened'}`}>
                <div className="btn-search-more-group-background" onClick={toggleViabilityOptionSection}/>
                <div className="btn-search-more-group-container">
                    <a target="_blank" className="btn btn-search-more"
                       href={`http://context.reverso.net/translation/english-russian/${word.word}`}>
                        <img src="https://cdn.reverso.net/context/v51100/images/reverso-context.ico" alt=""/>
                        reverso
                    </a>
                    <a target="_blank" className="btn btn-search-more"
                       href={`http://multitran.ru/c/m.exe?CL=1&l1=1&s=${word.word}`}>
                        <img src="https://www.multitran.com/gif/favicon.ico" alt=""/>
                        multitran
                    </a>
                    <a target="_blank" className="btn btn-search-more"
                       href={`https://www.vocabulary.com/dictionary/${word.word}`}>
                        <img src="https://cdn.vocab.com/images/favicons/favicon-32x32-2frmtt.png" alt=""/>
                        vocabulary
                    </a>
                    <a target="_blank" className="btn btn-search-more"
                       href={`http://www.dictionary.com/browse/${word.word}`}>
                        <img
                            src="https://www.dictionary.com/assets/favicon-1bff2f1b49c077ed504e55c3649f2a4b.png"
                            alt=""/>
                        dictionary
                    </a>
                </div>
            </div>
        </div>
    )
};

export const WordsList = () => {
    const [{wordsList}, dispatch] = useStateAppValue();

    const getWordItem = (wordsList) => {
        return wordsList.length
            ? wordsList.map((i, key) => <WordCard key={key} word={i}/>)
            : ''
    };

    return (
        <div className="wb-words-list-container">
            {getWordItem(wordsList)}
        </div>
    )
};
//@ts-nocheck
import { toLower } from "ramda";

export const filterNull = <T>(x: T | null | undefined): x is T => !!x;

export const isProduction = () => {
  return process.env.NODE_ENV === "production";
};

export const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};

let isDebugValue = isDevelopment();

const setIsDebug = (value) => {
  isDebugValue = value;
};

export const isDebug = () => {
  return isDebugValue;
};

// The extension built for local testing (`yarn dev`, `yarn build:local`, WXT mode "staging"): same
// messaging and storage as production. WXT sets NODE_ENV to the build mode, so "development" is left
// to the standalone page (`yarn start`) only.
export const isPostProd = () => {
  return process.env.NODE_ENV === "staging";
};

export const isWordEqualWith = (checkWord) => (inputWord) => {
  return toLower(checkWord) === toLower(inputWord);
};

export const getWord = (fn) => (wordList) => {
  return fn(wordList.word);
};

export function defer() {
  let deferred = {};
  // @ts-ignore
  deferred.promise = new Promise(function (resolve, reject) {
    // @ts-ignore
    deferred.resolve = resolve;
    // @ts-ignore
    deferred.reject = reject;
  });
  return deferred;
}

const langMap = {
  ua: "uk",
};
export const normalizeLang = (lang: string): string => {
  return langMap[lang] || lang;
};

export function isDeepEqual(obj1, obj2) {
  const jsonString1 = JSON.stringify(obj1);
  const jsonString2 = JSON.stringify(obj2);

  return jsonString1 === jsonString2;
}

export function getRandomBinary() {
  return Math.random() >= 0.5 ? 1 : 0;
}

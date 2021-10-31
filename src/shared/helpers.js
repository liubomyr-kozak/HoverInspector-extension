import { toLower } from "ramda";

export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
};

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
};

export const markAsRendered = (key) => ({
  [key]: "rendered"
})

export const markAsReRendered = (key) => ({
  [key]: "re-rendered"
})
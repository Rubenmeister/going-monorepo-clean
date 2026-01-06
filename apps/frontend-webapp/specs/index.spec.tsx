import React from 'react';
import { render } from '@testing-library/react';
import App from '../src/app/app';

// Mock the SplashScreen to skip animation
jest.mock('../src/screens/SplashScreen', () => ({
  SplashScreen: ({ onFinish }: { onFinish: () => void }) => {
    const React = require('react');
    React.useEffect(() => { onFinish(); }, [onFinish]);
    return null;
  },
}));

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });
});

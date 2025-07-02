import { render, screen } from '@testing-library/react';
import App from './App';

test('Başlık görünüyor', () => {
  render(<App />);
  expect(screen.getByText(/ilan/i)).toBeInTheDocument();
}); 
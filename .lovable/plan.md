
# Indian Options Trading Dashboard

## Overview
A comprehensive options trading dashboard for NSE India covering Nifty, BankNifty, FinNifty, and F&O stocks with live data via NSE API proxy.

## Pages & Features

### 1. Dashboard Home
- Market overview: Nifty, BankNifty, FinNifty spot prices with change %
- PCR ratio, India VIX, market sentiment indicator
- Quick links to option chains
- Dark theme (trader-friendly)

### 2. Option Chain View
- Selector for underlying (Nifty/BankNifty/FinNifty/Stocks) and expiry date
- Full option chain table: Strike, CE LTP, CE OI, CE Volume, CE IV, PE LTP, PE OI, PE Volume, PE IV
- ATM strike highlighted, color-coded ITM/OTM rows
- Auto-refresh toggle

### 3. OI Analysis
- OI bar chart (Calls vs Puts by strike)
- PCR ratio chart over time
- Max Pain calculator with visual indicator
- Change in OI analysis (OI buildup/unwinding)
- Top OI gainers/losers table

### 4. Greeks Calculator
- Input: spot price, strike, expiry, IV, risk-free rate
- Output: Delta, Gamma, Theta, Vega, Rho
- Black-Scholes model
- Interactive sliders for what-if analysis

### 5. Strategy Builder
- Select from preset strategies: Straddle, Strangle, Iron Condor, Bull/Bear Spreads, Butterfly
- Or build custom multi-leg strategies
- Payoff diagram (profit/loss at expiry chart)
- Breakeven points, max profit, max loss calculations
- Greeks summary for the combined position

## Backend
- Supabase Edge Function as NSE API proxy (handles CORS)
- Endpoints: `/option-chain`, `/indices`, `/fno-stocks`

## Design
- Dark theme optimized for trading
- Sidebar navigation with icons
- Responsive but desktop-first
- Color coding: Green for bullish/profit, Red for bearish/loss
- Clean data tables with sorting capability

## Tech
- Recharts for charts and payoff diagrams
- TanStack React Query for data fetching with auto-refresh
- shadcn/ui components for tables, tabs, selectors

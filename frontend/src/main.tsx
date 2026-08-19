import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from "./App";
import { AuthProvider, LoginPage, ProtectedRoute } from './auth';
import "./styles.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><AuthProvider><BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="*" element={<App />} /></Route></Routes></BrowserRouter></AuthProvider></React.StrictMode>);

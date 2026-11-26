
import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json"
    }
});

// Retrieve all leads
export const getAllLeads = async () => {
    const response = await api.get("/leads/");
    return response.data;
};

// Create a new lead
export const createLead = async (leadData) => {
    const response = await api.post("/leads/", leadData);
    return response.data;
};

// Retrieve one lead
export const getLeadById = async (leadId) => {
    const response = await api.get(`/leads/${leadId}`);
    return response.data;
};

// Update lead status
export const updateLeadStatus = async (leadId, status) => {
    const response = await api.patch(
        `/leads/${leadId}/status`,
        { status }
    );
    return response.data;
};

// Delete a lead
export const deleteLead = async (leadId) => {
    const response = await api.delete(`/leads/${leadId}`);
    return response.data;
};

// Filter leads
export const filterLeads = async (filters = {}) => {
    const response = await api.get("/leads/filter", {
        params: filters
    });
    return response.data;
};

export default api;

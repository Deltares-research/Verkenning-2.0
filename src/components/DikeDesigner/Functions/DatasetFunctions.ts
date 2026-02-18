/**
 * Functions for managing and downloading datasets from the backend API
 */

interface DatasetListResponse {
    datasets: string[];
    count: number;
}

/**
 * Fetches the list of available datasets from the backend API
 * @param apiUrl - Base URL of the API
 * @param apiKey - API key for authentication
 * @returns Promise with the list of dataset filenames
 */
export async function fetchDatasetList(apiUrl: string, apiKey: string): Promise<string[]> {
    try {
        const response = await fetch(`${apiUrl}datasets`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "X-API-Key": apiKey,
            },
            mode: 'cors',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
            throw new Error(errorData.detail || "Failed to fetch datasets");
        }

        const result: DatasetListResponse = await response.json();
        console.log("Available datasets:", result);
        
        return result.datasets;
    } catch (error) {
        console.error("Error fetching datasets:", error);
        throw error;
    }
}

/**
 * Downloads a single dataset file from the backend
 * @param apiUrl - Base URL of the API
 * @param apiKey - API key for authentication
 * @param filename - Name of the file to download
 */
export async function downloadDataset(apiUrl: string, apiKey: string, filename: string): Promise<void> {
    try {
        // Assuming there's an endpoint to download individual files
        // If not, you'll need to add one to the backend
        const response = await fetch(`${apiUrl}datasets/${filename}`, {
            method: "GET",
            headers: {
                "X-API-Key": apiKey,
            },
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error(`Failed to download ${filename}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Successfully downloaded: ${filename}`);
    } catch (error) {
        console.error(`Error downloading ${filename}:`, error);
        throw error;
    }
}

/**
 * Downloads all available datasets from the backend
 * @param apiUrl - Base URL of the API
 * @param apiKey - API key for authentication
 */
export async function downloadAllDatasets(apiUrl: string, apiKey: string): Promise<void> {
    try {
        const datasets = await fetchDatasetList(apiUrl, apiKey);
        
        if (datasets.length === 0) {
            console.log("No datasets available to download");
            return;
        }

        console.log(`Downloading ${datasets.length} datasets...`);
        
        // Download files sequentially with a small delay to avoid overwhelming the browser
        for (const filename of datasets) {
            await downloadDataset(apiUrl, apiKey, filename);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log("All datasets downloaded successfully");
    } catch (error) {
        console.error("Error downloading datasets:", error);
        throw error;
    }
}

/**
 * Downloads selected datasets from the backend
 * @param apiUrl - Base URL of the API
 * @param apiKey - API key for authentication
 * @param filenames - Array of filenames to download
 */
export async function downloadSelectedDatasets(
    apiUrl: string, 
    apiKey: string, 
    filenames: string[]
): Promise<void> {
    try {
        if (filenames.length === 0) {
            console.log("No datasets selected for download");
            return;
        }

        console.log(`Downloading ${filenames.length} selected datasets...`);
        
        for (const filename of filenames) {
            await downloadDataset(apiUrl, apiKey, filename);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log("Selected datasets downloaded successfully");
    } catch (error) {
        console.error("Error downloading selected datasets:", error);
        throw error;
    }
}

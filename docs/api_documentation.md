# REST API Backend Service Documentation

## Overview
This documentation provides an overview of the REST API backend service for the `sector-repo` repository.

## Base URL
The base URL for all API requests is:  
`https://api.example.com/v1`

## Authentication
The API uses API keys for authentication. Include the key in the `Authorization` header of requests.

## Endpoints

### 1. Get All Sectors
- **URL**: `/sectors`
- **Method**: `GET`
- **Description**: Retrieve a list of all sectors.
- **Response**: A JSON array of sector objects.

### 2. Get Sector By ID
- **URL**: `/sectors/{id}`
- **Method**: `GET`
- **Description**: Retrieve a specific sector by its ID.
- **Parameters**:
  - `id` (int) - The ID of the sector.
- **Response**: A JSON object representing the sector.

### 3. Create Sector
- **URL**: `/sectors`
- **Method**: `POST`
- **Description**: Create a new sector.
- **Request Body**: JSON object representing the new sector.
- **Response**: JSON object of the created sector with its new ID.

### 4. Update Sector
- **URL**: `/sectors/{id}`
- **Method**: `PUT`
- **Description**: Update an existing sector.
- **Parameters**:
  - `id` (int) - The ID of the sector to update.
- **Request Body**: JSON object representing the updated sector.
- **Response**: JSON object of the updated sector.

### 5. Delete Sector
- **URL**: `/sectors/{id}`
- **Method**: `DELETE`
- **Description**: Delete a sector by its ID.
- **Parameters**:
  - `id` (int) - The ID of the sector to delete.
- **Response**: A success message or error message.

## Error Handling
- Standard error responses are provided with appropriate HTTP status codes and error messages.

## Examples

### Get All Sectors Example
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.example.com/v1/sectors
```

### Create Sector Example
```bash
curl -X POST -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" -d '{ "name": "New Sector" }' https://api.example.com/v1/sectors
```
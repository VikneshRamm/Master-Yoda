import time
import requests
from settings import settings


def get_all_descriptions(project_id, user_id, rangeStart, rangeEnd):
    """
    Retrieve all unique time entry descriptions from Clockify for a specific project and user within a date range.
    
    This function fetches time tracking descriptions logged by a user on a specific project
    for a custom date range. It automatically handles pagination to retrieve all entries
    and returns deduplicated descriptions.
    
    Args:
        project_id (str): The Clockify project ID to fetch time entries from.
        user_id (str): The Clockify user ID whose time entries should be retrieved.
        rangeStart (str): Start date in ISO 8601 format (e.g., "2025-06-13T00:00:00.000Z").
        rangeEnd (str): End date in ISO 8601 format (e.g., "2025-10-24T23:59:59.000Z").
    
    Returns:
        str: A comma-separated string of unique time entry descriptions in the order
             they were first encountered. Empty descriptions are excluded.
    
    Example:
        descriptions = get_all_descriptions(
            "proj123", 
            "user456",
            "2025-06-01T00:00:00.000Z",
            "2025-12-31T23:59:59.000Z"
        )
        # Returns: "Frontend development, API integration, Code review, Bug fixes"
    
    Note:
        - Requires valid Clockify API credentials in settings (clockify_api_key, clockify_workspace_id)
        - Respects API rate limits with 100ms delay between paginated requests
        - Preserves original case and order of first occurrence
        - Date format must be ISO 8601 with timezone (UTC recommended)
    """
    try:
        url = f"https://reports.api.clockify.me/v1/workspaces/{settings.clockify_workspace_id}/reports/detailed"
        headers = {
            "X-Api-Key": settings.clockify_api_key,
            "Content-Type": "application/json"
        }
        
        all_descriptions = []
        current_page = 1
        
        while True:
            payload = {
                "dateRangeStart": rangeStart,
                "dateRangeEnd": rangeEnd,
                "detailedFilter": {
                    "page": current_page,
                    "pageSize": 1000
                },
                "projects": {"ids": [project_id]},
                "users": {"ids": [user_id]},
                "amountShown": "HIDE_AMOUNT"
            }
            
            response = requests.post(url, json=payload, headers=headers)
            data = response.json()
            
            # Extract entries from this page
            entries = data.get('timeentries', [])
            
            if not entries:
                break  # Exit loop if no more entries
                
            for entry in entries:
                if entry.get('description'):
                    all_descriptions.append(entry['description'])
            
            print(f"Fetched page {current_page}...")
            current_page += 1
            
            # Short sleep to respect rate limits (50 req/sec, but good to be safe)
            time.sleep(0.1) 
        
        
        # all_descriptions = list(set(desc.lower() for desc in all_descriptions))
        all_descriptions = list(dict.fromkeys(all_descriptions))
        
        final_text = ", ".join(all_descriptions)
        return final_text
    except Exception as e:
        print(f"Error fetching descriptions: {str(e)}")
        return ""

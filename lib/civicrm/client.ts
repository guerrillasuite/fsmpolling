// lib/civicrm/client.ts
/**
 * CiviCRM REST API Client
 * Documentation: https://docs.civicrm.org/dev/en/latest/api/
 */

export interface CiviCRMConfig {
  apiEndpoint: string;
  siteKey: string;
  apiKey: string;
}

export interface CiviCRMContact {
  id?: number;
  contact_type?: 'Individual' | 'Organization' | 'Household';
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  [key: string]: any; // For custom fields
}

export interface CiviCRMResponse {
  is_error: 0 | 1;
  error_message?: string;
  count?: number;
  id?: number;
  values?: any;
}

export class CiviCRMClient {
  private config: CiviCRMConfig;

  constructor(config?: CiviCRMConfig) {
    this.config = config || {
      apiEndpoint: process.env.CIVICRM_API_ENDPOINT || '',
      siteKey: process.env.CIVICRM_SITE_KEY || '',
      apiKey: process.env.CIVICRM_API_KEY || '',
    };

    if (!this.config.apiEndpoint || !this.config.siteKey || !this.config.apiKey) {
      console.warn('CiviCRM credentials not fully configured. Check environment variables.');
    }
  }

  /**
   * Make a REST API call to CiviCRM
   */
  private async apiCall(
    entity: string,
    action: string,
    params: Record<string, any> = {}
  ): Promise<CiviCRMResponse> {
    // Determine if this is a write operation (requires POST)
    const writeActions = ['create', 'update', 'delete', 'replace', 'setvalue'];
    const isWriteOperation = writeActions.includes(action.toLowerCase());

    const url = new URL(this.config.apiEndpoint);

    // Add authentication and entity/action
    url.searchParams.set('key', this.config.siteKey);
    url.searchParams.set('api_key', this.config.apiKey);
    url.searchParams.set('entity', entity);
    url.searchParams.set('action', action);
    url.searchParams.set('json', '1');

    // Add all parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: isWriteOperation ? 'POST' : 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CiviCRMResponse = await response.json();

      if (data.is_error === 1) {
        throw new Error(`CiviCRM API Error: ${data.error_message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('CiviCRM API call failed:', {
        entity,
        action,
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get custom field information by name
   */
  async getCustomField(fieldName: string): Promise<any> {
    const response = await this.apiCall('CustomField', 'get', {
      name: fieldName,
      sequential: 1,
    });

    if (response.values && Array.isArray(response.values) && response.values.length > 0) {
      return response.values[0];
    }

    return null;
  }

  /**
   * Get all custom fields for a custom group
   */
  async getCustomFieldsByGroup(groupName: string): Promise<Record<string, any>> {
    // First get the custom group
    const groupResponse = await this.apiCall('CustomGroup', 'get', {
      name: groupName,
      sequential: 1,
    });

    if (!groupResponse.values || !Array.isArray(groupResponse.values) || groupResponse.values.length === 0) {
      throw new Error(`Custom group "${groupName}" not found`);
    }

    const groupId = groupResponse.values[0].id;

    // Get all fields in this group
    const fieldsResponse = await this.apiCall('CustomField', 'get', {
      custom_group_id: groupId,
    });

    const fields: Record<string, any> = {};
    if (fieldsResponse.values) {
      Object.values(fieldsResponse.values).forEach((field: any) => {
        fields[field.name] = field;
      });
    }

    return fields;
  }

  /**
   * Find or create a contact by email
   */
  async findOrCreateContact(contactData: CiviCRMContact): Promise<number> {
    // Try to find by email first
    if (contactData.email) {
      const searchResponse = await this.apiCall('Contact', 'get', {
        email: contactData.email,
        sequential: 1,
      });

      if (searchResponse.values && Array.isArray(searchResponse.values) && searchResponse.values.length > 0) {
        return searchResponse.values[0].id;
      }
    }

    // Contact not found, create new one
    const createResponse = await this.apiCall('Contact', 'create', {
      contact_type: contactData.contact_type || 'Individual',
      first_name: contactData.first_name,
      last_name: contactData.last_name,
      email: contactData.email,
    });

    if (!createResponse.id) {
      throw new Error('Failed to create contact');
    }

    return createResponse.id;
  }

  /**
   * Update contact with custom field data
   */
  async updateContactCustomFields(
    contactId: number,
    customFields: Record<string, any>
  ): Promise<void> {
    const params: Record<string, any> = {
      id: contactId,
      ...customFields,
    };

    await this.apiCall('Contact', 'create', params);
  }

  /**
   * Add tags to a contact
   */
  async addTagsToContact(contactId: number, tags: string[]): Promise<void> {
    for (const tagName of tags) {
      // First, find or create the tag
      const tagResponse = await this.apiCall('Tag', 'get', {
        name: tagName,
        sequential: 1,
      });

      let tagId: number;

      if (tagResponse.values && Array.isArray(tagResponse.values) && tagResponse.values.length > 0) {
        tagId = tagResponse.values[0].id;
      } else {
        // Create the tag
        const createTagResponse = await this.apiCall('Tag', 'create', {
          name: tagName,
          used_for: 'civicrm_contact',
        });

        if (!createTagResponse.id) {
          console.error(`Failed to create tag: ${tagName}`);
          continue;
        }

        tagId = createTagResponse.id;
      }

      // Add the tag to the contact
      await this.apiCall('EntityTag', 'create', {
        entity_table: 'civicrm_contact',
        entity_id: contactId,
        tag_id: tagId,
      });
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: number): Promise<CiviCRMContact | null> {
    const response = await this.apiCall('Contact', 'get', {
      id: contactId,
      sequential: 1,
    });

    if (response.values && Array.isArray(response.values) && response.values.length > 0) {
      return response.values[0];
    }

    return null;
  }
}

// Export singleton instance
let clientInstance: CiviCRMClient | null = null;

export function getCiviCRMClient(): CiviCRMClient {
  if (!clientInstance) {
    clientInstance = new CiviCRMClient();
  }
  return clientInstance;
}

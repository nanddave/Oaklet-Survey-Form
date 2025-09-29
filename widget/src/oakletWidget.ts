interface WidgetConfig {
  organizationId?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    logo?: string;
    borderRadius?: string;
  };
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

interface SurveyResult {
  success: boolean;
  submissionId?: string;
  appointmentId?: string;
  confirmationNumber?: string;
  message?: string;
  nextSteps?: string[];
}

export class OakletSurveyWidget {
  private config: WidgetConfig;
  private modal: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private isOpen: boolean = false;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      organizationId: config.organizationId || 'default-org',
      theme: {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '12px',
        ...config.theme
      },
      ...config
    };

    this.setupEventListeners();
  }

  init(containerId: string): HTMLElement {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element '${containerId}' not found`);
    }

    this.createModal(container);
    return container;
  }

  private createModal(container: HTMLElement): void {
    const modalHTML = `
      <div class="oaklet-survey-overlay" style="
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        justify-content: center;
        align-items: center;
        font-family: ${this.config.theme?.fontFamily};
      ">
        <div class="oaklet-survey-modal" style="
          background: ${this.config.theme?.backgroundColor};
          border-radius: ${this.config.theme?.borderRadius};
          width: 90%;
          max-width: 800px;
          height: 90%;
          max-height: 800px;
          position: relative;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        ">
          <button class="oaklet-close-btn" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 18px;
            cursor: pointer;
            z-index: 10001;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(255, 255, 255, 1)'; this.style.color='#333';" 
             onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.color='#666';">
            ×
          </button>
          <iframe 
            src="${this.buildSurveyUrl()}" 
            frameborder="0" 
            style="
              width: 100%;
              height: 100%;
              border-radius: ${this.config.theme?.borderRadius};
            "
            title="Oaklet Survey Form">
          </iframe>
        </div>
      </div>
    `;
    
    container.innerHTML = modalHTML;
    this.modal = container.querySelector('.oaklet-survey-overlay') as HTMLElement;
    this.iframe = container.querySelector('iframe') as HTMLIFrameElement;
    
    // Add close button functionality
    const closeBtn = container.querySelector('.oaklet-close-btn') as HTMLButtonElement;
    closeBtn?.addEventListener('click', () => this.hide());
  }

  private buildSurveyUrl(): string {
    const params = new URLSearchParams({
      org: this.config.organizationId!,
      mode: 'widget',
      theme: JSON.stringify(this.config.theme)
    });
    
    // Use build-time constants instead of runtime process.env
    const surveyUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5173'  // Development URL
      : 'https://survey.oakletsuite.com';  // Production URL
    
    return `${surveyUrl}/widget?${params}`;
  }

  show(): void {
    if (this.modal && !this.isOpen) {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      this.isOpen = true;
      
      // Focus the iframe for accessibility
      setTimeout(() => {
        this.iframe?.focus();
      }, 100);
    }
  }

  hide(): void {
    if (this.modal && this.isOpen) {
      this.modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      this.isOpen = false;
      this.config.onClose?.();
    }
  }

  private setupEventListeners(): void {
    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      // Security: verify origin
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://survey.oakletsuite.com'
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Oaklet Widget: Message from unauthorized origin', event.origin);
        return;
      }

      switch (event.data.type) {
        case 'survey.completed':
          this.handleSurveyComplete(event.data.result);
          break;
          
        case 'survey.error':
          this.handleSurveyError(event.data.error);
          break;
          
        case 'survey.close':
          this.hide();
          break;

        case 'survey.resized':
          this.handleResize(event.data.height);
          break;
      }
    });

    // Close modal when clicking outside (only if not clicking on iframe)
    document.addEventListener('click', (event) => {
      if (this.isOpen && this.modal && event.target === this.modal) {
        this.hide();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (event) => {
      if (this.isOpen && event.key === 'Escape') {
        this.hide();
      }
    });
  }

  private handleSurveyComplete(result: SurveyResult): void {
    this.hide();
    this.config.onComplete?.(result);
    
    // Show success notification
    this.showNotification(
      'Survey completed successfully!',
      'Your appointment has been scheduled.',
      'success'
    );
  }

  private handleSurveyError(error: any): void {
    this.config.onError?.(error);
    
    // Show error notification
    this.showNotification(
      'Survey Error',
      'There was an issue completing the survey. Please try again.',
      'error'
    );
  }

  private handleResize(height: number): void {
    if (this.modal) {
      const modalContent = this.modal.querySelector('.oaklet-survey-modal') as HTMLElement;
      if (modalContent) {
        modalContent.style.height = `${Math.min(height + 40, window.innerHeight * 0.9)}px`;
      }
    }
  }

  private showNotification(title: string, message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10002;
      font-family: ${this.config.theme?.fontFamily};
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
      <div style="font-size: 14px; opacity: 0.9;">${message}</div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
      }, 300);
    }, 5000);
  }

  // Static method to create a button
  static createButton(config: WidgetConfig & { buttonText?: string }): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = config.buttonText || 'Schedule Consultation';
    button.style.cssText = `
      background: ${config.theme?.primaryColor || '#3b82f6'};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: ${config.theme?.borderRadius || '8px'};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      font-family: ${config.theme?.fontFamily || 'inherit'};
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    });

    const widget = new OakletSurveyWidget(config);
    button.addEventListener('click', () => widget.show());

    return button;
  }
}

// Global exposure for easy client integration
declare global {
  interface Window {
    OakletSurvey: typeof OakletSurveyWidget;
  }
}

window.OakletSurvey = OakletSurveyWidget;

export default OakletSurveyWidget;

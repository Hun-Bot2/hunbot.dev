/**
 * Theme Manager
 * 다크/라이트 테마 전환 및 색상 관리
 */

export class ThemeManager {
  constructor() {
    this.isDarkTheme = true;
    this.sunIcon = document.getElementById('sunIcon');
    this.moonIcon = document.getElementById('moonIcon');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    
    this.init();
  }

  /**
   * 테마 매니저 초기화
   */
  init() {
    // 저장된 테마 불러오기 (localStorage 대신 세션 스토리지 사용)
    const savedTheme = sessionStorage.getItem('neural-blog-theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }
    
    this.applyTheme();
    this.bindEvents();
  }

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  /**
   * 테마 전환
   */
  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    this.saveTheme();
    
    // 테마 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { isDarkTheme: this.isDarkTheme }
    }));
  }

  /**
   * 테마 적용
   */
  applyTheme() {
    const body = document.body;
    
    if (this.isDarkTheme) {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      // 아이콘 전환 JS 삭제 (CSS에서 처리)
      if (this.themeToggleBtn) {
        this.themeToggleBtn.setAttribute('data-theme', 'dark');
      }
    } else {
      body.classList.remove('dark-theme');  
      body.classList.add('light-theme');
      // 아이콘 전환 JS 삭제 (CSS에서 처리)
      if (this.themeToggleBtn) {
        this.themeToggleBtn.setAttribute('data-theme', 'light');
      }
    }
  }

  /**
   * 테마 저장
   */
  saveTheme() {
    sessionStorage.setItem('neural-blog-theme', this.isDarkTheme ? 'dark' : 'light');
  }

  /**
   * 현재 테마 색상 팔레트 반환
   */
  getThemeColors() {
    if (this.isDarkTheme) {
      return {
        background: 0x000000,    // Pure black for elegance
        connections: 0x666666,   // Subtle gray connections
        connectionOpacity: 0.3,  // More subtle
        particles: 0x444444,     // Very subtle particles
        nodeColors: {
          default: 0x007AFF,     // Apple Blue
          brain: 0x007AFF,       // Apple Blue  
          math: 0x34C759,        // Apple Green
          contest: 0xFF9500,     // Apple Orange
          dummy: 0x8E8E93,       // Apple Gray
          ai: 0x5856D6,          // Apple Purple
          dev: 0x32D74B,         // Apple Mint Green
          viz: 0xFF9F0A,         // Apple Yellow
          memory: 0xFF2D92       // Apple Pink
        }
      };
    } else {
      // Light mode - Apple's sophisticated palette
      return {
        background: 0xF2F2F7,    // Apple Light Gray background
        connections: 0xC7C7CC,   // Apple separator color
        connectionOpacity: 0.4,
        particles: 0xAEAEB2,     // Apple secondary label
        nodeColors: {
          default: 0x007AFF,     // Apple Blue
          brain: 0x007AFF,       // Apple Blue
          math: 0x34C759,        // Apple Green
          contest: 0xFF9500,     // Apple Orange
          dummy: 0x8E8E93,       // Apple Gray
          ai: 0x5856D6,          // Apple Purple
          dev: 0x32D74B,         // Apple Mint Green
          viz: 0xFF9F0A,         // Apple Yellow
          memory: 0xFF2D92       // Apple Pink
        }
      };
    }
  }

  /**
   * 특정 태그에 따른 색상 반환 - 뇌 영역별 색상 매핑
   */
  getColorByTags(tags) {
    const colors = this.getThemeColors().nodeColors;
    
    if (!tags || tags.length === 0) {
      return colors.memory; // 기본값을 memory 색상으로
    }
    
    // 뇌 영역별 태그 매핑
    // Frontal (AI/ML) - 보라색
    if (tags.some(tag => ['AI', '인공지능', 'ML', 'Deep Learning', '딥러닝', 'Machine Learning'].includes(tag))) {
      return colors.ai;
    }
    
    // Parietal (Math/Statistics) - 그린
    if (tags.some(tag => ['수학', '통계', 'Statistics', 'Math', '확률', '미적분'].includes(tag))) {
      return colors.math;
    }
    
    // Temporal (Development) - 청록색
    if (tags.some(tag => ['개발', 'Development', '코딩', 'Programming', 'JavaScript', 'Python', 'React', 'Node'].includes(tag))) {
      return colors.dev;
    }
    
    // Occipital (Visualization) - 주황색
    if (tags.some(tag => ['시각화', 'Visualization', 'Design', 'Three.js', 'Canvas', 'Graphics'].includes(tag))) {
      return colors.viz;
    }
    
    // Memory (기타) - 분홍색
    return colors.memory;
  }

  /**
   * 현재 테마 반환
   */
  getCurrentTheme() {
    return this.isDarkTheme ? 'dark' : 'light';
  }
}
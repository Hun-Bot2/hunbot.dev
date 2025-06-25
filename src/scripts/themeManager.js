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
        background: 0x000000,
        connections: 0xffffff,
        connectionOpacity: 0.4,
        particles: 0xcccccc,
        nodeColors: {
          default: 0x00d4ff,    // 사이버 블루
          brain: 0xff0080,      // 네온 핑크
          math: 0x00ff88,       // 네온 그린
          contest: 0xff8c00,    // 네온 오렌지
          dummy: 0x888888       // 회색
        }
      };
    } else {
      return {
        background: 0xffffff,
        connections: 0x333333,
        connectionOpacity: 0.3,
        particles: 0x666666,
        nodeColors: {
          default: 0x0066cc,    // 진한 파랑
          brain: 0xcc0066,      // 진한 핑크
          math: 0x009944,       // 진한 그린
          contest: 0xcc6600,    // 진한 오렌지
          dummy: 0x666666       // 회색
        }
      };
    }
  }

  /**
   * 특정 태그에 따른 색상 반환
   */
  getColorByTags(tags) {
    const colors = this.getThemeColors().nodeColors;
    
    if (!tags || tags.length === 0) {
      return colors.dummy;
    }
    
    // 태그 우선순위에 따른 색상 결정
    if (tags.includes('뇌공학') || tags.includes('AI')) {
      return colors.brain;
    }
    if (tags.includes('수학') || tags.includes('통계')) {
      return colors.math;
    }
    if (tags.includes('공모전') || tags.includes('회고')) {
      return colors.contest;
    }
    
    return colors.default;
  }

  /**
   * 현재 테마 반환
   */
  getCurrentTheme() {
    return this.isDarkTheme ? 'dark' : 'light';
  }
}
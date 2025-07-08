/**
 * Controls Manager
 * 3D 뉴럴 네트워크 컨트롤 (재생/일시정지, 리셋)
 */

export class ControlsManager {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.isAnimating = true;
    this.initialCameraZ = 10;
    this.minZoom = 5;
    this.maxZoom = 20;
    
    // DOM 요소 참조 (확대/축소 버튼 제거)
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.playIcon = document.getElementById('playIcon');
    this.pauseIcon = document.getElementById('pauseIcon');
    this.resetBtn = document.getElementById('resetBtn');
    
    this.init();
  }

  /**
   * 컨트롤 매니저 초기화
   */
  init() {
    this.bindEvents();
    this.updatePlayPauseIcon();
  }

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 재생/일시정지 버튼
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.toggleAnimation();
      });
    }

    // 리셋 버튼
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.resetView();
      });
    }

    // 키보드 단축키
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event);
    });

    // 마우스 휠/트랙패드 줌 (개선된 버전)
    const canvas = document.querySelector('#neural-network-3d canvas');
    if (canvas) {
      canvas.addEventListener('wheel', (event) => {
        this.handleMouseWheel(event);
      }, { passive: false });
    }
  }

  /**
   * 애니메이션 재생/일시정지 토글
   */
  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
    this.updatePlayPauseIcon();
    
    // 애니메이션 상태 변경 이벤트 발생
    window.dispatchEvent(new CustomEvent('animationToggled', {
      detail: { isAnimating: this.isAnimating }
    }));

    // 버튼 상태 클래스 업데이트
    if (this.playPauseBtn) {
      this.playPauseBtn.classList.toggle('playing', this.isAnimating);
      this.playPauseBtn.classList.toggle('paused', !this.isAnimating);
    }
  }

  /**
   * 재생/일시정지 아이콘 업데이트
   */
  updatePlayPauseIcon() {
    if (this.playIcon && this.pauseIcon) {
      if (this.isAnimating) {
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';
      } else {
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
      }
    }
  }

  /**
   * 뷰 리셋
   */
  resetView() {
    this.animateCamera(this.initialCameraZ);
    
    // 카메라 위치와 회전 리셋
    this.camera.position.set(0, 0, this.initialCameraZ);
    this.camera.lookAt(0, 0, 0);
    
    // 씬 회전 리셋
    this.scene.rotation.set(0, 0, 0);
  }

  /**
   * 부드러운 카메라 애니메이션
   */
  animateCamera(targetZ) {
    const startZ = this.camera.position.z;
    const duration = 300; // 밀리초
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeInOutQuad 이징 함수
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      this.camera.position.z = startZ + (targetZ - startZ) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 키보드 단축키 처리
   */
  handleKeyboardShortcuts(event) {
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.toggleAnimation();
        break;
      case 'KeyR':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.resetView();
        }
        break;
    }
  }

  /**
   * 마우스 휠/트랙패드 줌 처리 (개선된 버전)
   */
  handleMouseWheel(event) {
    // 캔버스 영역에서만 줌 동작, 밖에서는 페이지 스크롤
    const canvas = event.target.closest('#neural-network-3d');
    if (!canvas) {
      return; // 캔버스 밖에서는 기본 스크롤 허용
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    // 델타 값 정규화 (브라우저별 차이 보정)
    let delta = event.deltaY;
    
    // 트랙패드와 마우스휠 구분 (대략적)
    if (Math.abs(delta) < 100) {
      // 트랙패드 - 더 빠른 조작
      delta = delta * 0.03;
    } else {
      // 마우스휠 - 더 큰 단위로 조작
      delta = delta > 0 ? 1.0 : -1.0;
    }
    
    const newZ = Math.max(
      this.minZoom, 
      Math.min(this.maxZoom, this.camera.position.z + delta)
    );
    
    this.camera.position.z = newZ;
  }

  /**
   * 애니메이션 상태 반환
   */
  getAnimationState() {
    return this.isAnimating;
  }

  /**
   * 애니메이션 상태 설정
   */
  setAnimationState(isAnimating) {
    this.isAnimating = isAnimating;
    this.updatePlayPauseIcon();
  }

  /**
   * 현재 줌 레벨 반환 (0-1 범위)
   */
  getZoomLevel() {
    return (this.maxZoom - this.camera.position.z) / (this.maxZoom - this.minZoom);
  }
}
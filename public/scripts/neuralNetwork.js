/**
 * Neural Network 3D Visualization
 * 3D 뉴럴 네트워크 시각화 메인 클래스
 */

import { ThemeManager } from './themeManager.js';
import { ControlsManager } from './controlsManager.js';

export class NeuralNetwork3D {
  constructor(postsData, containerId = 'neural-network-3d') {
    this.postsData = postsData;
    this.containerId = containerId;
    
    // THREE.js 객체들
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // 네트워크 구성 요소
    this.nodes = [];
    this.connections = [];
    this.particles = null;
    this.textLabels = [];
    
    // 상태 관리
    this.animationId = null;
    this.time = 0;
    this.hoveredNode = null;
    
    // 매니저들
    this.themeManager = null;
    this.controlsManager = null;
    
    // 상호작용
    this.raycaster = null;
    this.mouse = null;
    this.tooltip = null;
    this.tooltipTitle = null;
    this.tooltipTags = null;
    
    // 텍스트 렌더링
    this.fontLoader = null;
    this.font = null;
    
    // 뇌 같은 유기적 구조 - 더 작은 크기로 조정
    this.brainRegions = [
      { name: 'Frontal', center: { x: 0, y: 1.5, z: 0.8 }, radius: 1.8, posts: [] },
      { name: 'Parietal', center: { x: -1.5, y: 0, z: 0 }, radius: 1.5, posts: [] },
      { name: 'Temporal', center: { x: 1.5, y: -0.8, z: -0.8 }, radius: 1.3, posts: [] },
      { name: 'Occipital', center: { x: 0, y: -1.5, z: -1.5 }, radius: 1.2, posts: [] },
      { name: 'Memory', center: { x: 0, y: 0, z: 1.5 }, radius: 1.0, posts: [] }
    ];
    
    // 카메라 컨트롤 상태
    this.controls = null;
  }

  /**
   * 초기화
   */
  async init() {
    try {
      // THREE.js 라이브러리 로드 확인
      if (typeof THREE === 'undefined') {
        throw new Error('THREE.js library not loaded');
      }

      this.setupScene();
      this.setupManagers();
      await this.loadFont();
      this.distributePosts();
      await this.createNetworkStructure();
      this.setupInteractions();
      this.bindEvents();
      this.startAnimation();
      
      console.log('Neural Network 3D initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Neural Network 3D:', error);
    }
  }

  /**
   * THREE.js 씬 설정
   */
  setupScene() {
    // 씬 생성
    this.scene = new THREE.Scene();
    
    // 컨테이너 크기 가져오기
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container with id '${this.containerId}' not found`);
    }
    
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    // 카메라 생성 - 반응형 비율 조정
    this.camera = new THREE.PerspectiveCamera(
      75, 
      width / height, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    
    // 렌더러 생성 - 컨테이너 크기에 맞춤
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x0f0f23, 1); // 더 밝은 다크 블루 배경
    
    // DOM에 추가
    container.appendChild(this.renderer.domElement);
    
    // 툴팁 요소 참조
    this.tooltip = document.getElementById('tooltip');
    this.tooltipTitle = document.querySelector('.tooltip-title');
    this.tooltipTags = document.querySelector('.tooltip-tags');
  }

  /**
   * 매니저들 설정
   */
  setupManagers() {
    // 테마 매니저 초기화
    this.themeManager = new ThemeManager();
    
    // 컨트롤 매니저 초기화
    this.controlsManager = new ControlsManager(this.camera, this.scene);
    
    // 키보드 컨트롤 설정
    this.setupKeyboardControls();
  }

  /**
   * 폰트 로드
   */
  async loadFont() {
    return new Promise((resolve, reject) => {
      this.fontLoader = new THREE.FontLoader();
      
      // Try to load a web font, fallback to system font if not available
      this.fontLoader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        (font) => {
          this.font = font;
          resolve();
        },
        undefined,
        (error) => {
          console.warn('Failed to load custom font, using fallback');
          // Create a simple fallback font configuration
          this.font = null;
          resolve();
        }
      );
    });
  }

  /**
   * 포스트를 뇌 영역별로 분배
   */
  distributePosts() {
    if (!this.postsData || this.postsData.length === 0) return;
    
    // 태그 기반으로 포스트를 뇌 영역에 분배
    this.postsData.forEach((post, index) => {
      const tags = post.tags || [];
      let assignedRegion = null;
      
      // 태그 기반 분류
      if (tags.some(tag => ['AI', '인공지능', 'ML', 'Deep Learning'].includes(tag))) {
        assignedRegion = this.brainRegions.find(r => r.name === 'Frontal');
      } else if (tags.some(tag => ['수학', '통계', 'Statistics', 'Math'].includes(tag))) {
        assignedRegion = this.brainRegions.find(r => r.name === 'Parietal');
      } else if (tags.some(tag => ['개발', 'Development', '코딩', 'Programming'].includes(tag))) {
        assignedRegion = this.brainRegions.find(r => r.name === 'Temporal');
      } else if (tags.some(tag => ['시각화', 'Visualization', 'Design'].includes(tag))) {
        assignedRegion = this.brainRegions.find(r => r.name === 'Occipital');
      } else {
        assignedRegion = this.brainRegions.find(r => r.name === 'Memory');
      }
      
      if (assignedRegion) {
        assignedRegion.posts.push({ ...post, index });
      }
    });
  }

  /**
   * 네트워크 구조 생성
   */
  async createNetworkStructure() {
    this.createBrainNodes();
    await this.createTextLabels();
    this.createConnections();
    this.createParticles();
  }

  /**
   * 뇌 구조 기반 노드 생성
   */
  createBrainNodes() {
    const themeColors = this.themeManager.getThemeColors();
    
    this.brainRegions.forEach((region, regionIndex) => {
      const { center, radius, posts } = region;
      
      // 각 영역에 포스트 노드들 배치
      posts.forEach((post, postIndex) => {
        // 유기적인 구 형태로 배치
        const phi = Math.acos(-1 + (2 * postIndex) / posts.length);
        const theta = Math.sqrt(posts.length * Math.PI) * phi;
        
        const x = center.x + radius * Math.cos(theta) * Math.sin(phi) * (0.6 + Math.random() * 0.4);
        const y = center.y + radius * Math.sin(theta) * Math.sin(phi) * (0.6 + Math.random() * 0.4);
        const z = center.z + radius * Math.cos(phi) * (0.6 + Math.random() * 0.4);
        
        // 포스트 노드 생성 - Apple-style 미니멀 크기
        const color = this.themeManager.getColorByTags(post.tags);
        const size = 0.06 + (post.tags?.length || 0) * 0.005; // 매우 작고 정제된 크기
        
        const geometry = new THREE.SphereGeometry(size, 20, 20);
        const material = new THREE.MeshBasicMaterial({ 
          color,
          transparent: true,
          opacity: 0.9 // More solid for better visibility
        });
        const node = new THREE.Mesh(geometry, material);
        node.position.set(x, y, z);
        
        // 메타데이터 저장
        node.userData = {
          post,
          originalColor: color,
          originalSize: size,
          link: `/blog/${post.id}/`,
          title: post.title,
          region: region.name,
          importance: post.tags?.length || 1
        };
        
        // 미니멀한 글로우 효과 (Apple style - very subtle)
        const glowGeometry = new THREE.SphereGeometry(size * 1.5, 12, 12);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.15 // Much more subtle
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(node.position);
        
        // Remove ring effect for cleaner look
        
        this.scene.add(node);
        this.scene.add(glow);
        this.nodes.push({ mesh: node, glow, ring: null, post });
      });
      
      // 영역 경계 시각화 (와이어프레임 구) - 태그 기반 색상 적용
      if (posts.length > 0) {
        const regionGeometry = new THREE.SphereGeometry(radius, 24, 24);
        
        // 영역의 주요 태그 색상 계산
        const allTags = posts.flatMap(post => post.tags || []);
        const mainTag = allTags.length > 0 ? allTags[0] : 'general';
        const regionColor = this.themeManager.getColorByTags([mainTag]);
        
        const regionMaterial = new THREE.MeshBasicMaterial({
          color: regionColor,
          transparent: true,
          opacity: 0.03, // Much more subtle
          wireframe: true
        });
        const regionBoundary = new THREE.Mesh(regionGeometry, regionMaterial);
        regionBoundary.position.set(center.x, center.y, center.z);
        this.scene.add(regionBoundary);
        
        // Remove center points for cleaner Apple-style design
      }
    });
  }

  /**
   * 3D 텍스트 라벨 생성
   */
  async createTextLabels() {
    // 한국어 블로그이므로 HTML 오버레이 방식을 강제 사용
    // Canvas와 3D 폰트는 한국어 지원이 불안정하므로 HTML을 사용
    console.log('Using HTML overlay for Korean text support');
    this.createHTMLTextLabels();
    return;
    
    if (!this.font) {
      // 폰트가 없으면 Canvas 기반 텍스트 사용
      await this.createCanvasTextLabels();
      return;
    }
    
    this.nodes.forEach((nodeData) => {
      if (!nodeData.post) return;
      
      const post = nodeData.post;
      const position = nodeData.mesh.position;
      
      // 제목을 짧게 자르기
      const title = post.title.length > 15 
        ? post.title.substring(0, 15) + '...' 
        : post.title;
      
      // 3D 텍스트 생성
      const textGeometry = new THREE.TextGeometry(title, {
        font: this.font,
        size: 0.08,
        height: 0.01,
        curveSegments: 12
      });
      
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      // 텍스트 위치 조정
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      
      textMesh.position.set(
        position.x - textWidth / 2,
        position.y + 0.3,
        position.z
      );
      
      // 카메라를 향하도록 설정
      textMesh.lookAt(this.camera.position);
      
      this.scene.add(textMesh);
      this.textLabels.push({
        mesh: textMesh,
        node: nodeData.mesh,
        originalPosition: textMesh.position.clone()
      });
    });
  }

  /**
   * Canvas 기반 텍스트 라벨 생성 (폰트 로드 실패시 대안)
   */
  async createCanvasTextLabels() {
    // 폰트 로딩 확인
    await this.ensureKoreanFontLoaded();
    
    // 한국어 텍스트 테스트
    const testResult = this.testKoreanFontRendering();
    
    if (!testResult) {
      console.warn('Korean font rendering failed, using HTML overlay method');
      this.createHTMLTextLabels();
      return;
    }
    
    this.nodes.forEach((nodeData) => {
      if (!nodeData.post) return;
      
      const post = nodeData.post;
      const position = nodeData.mesh.position;
      
      // 제목을 짧게 자르기
      const title = post.title.length > 15 
        ? post.title.substring(0, 15) + '...' 
        : post.title;
      
      // Canvas 텍스트 생성
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 512;
      canvas.height = 128;
      
      // 투명 배경
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // 한국어 텍스트 폰트 설정 - 시스템 폰트를 우선으로
      const fontFamily = this.getKoreanFontFamily();
      context.font = `bold 28px ${fontFamily}`;
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // 텍스트 렌더링 품질 향상
      context.textRenderingOptimization = 'optimizeQuality';
      
      // 배경 어두운 영역 추가 (가독성 향상)
      const textMetrics = context.measureText(title);
      const textWidth = textMetrics.width;
      const padding = 20;
      
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(
        canvas.width / 2 - textWidth / 2 - padding,
        canvas.height / 2 - 20,
        textWidth + padding * 2,
        40
      );
      
      // 텍스트 그리기
      context.fillStyle = '#ffffff';
      context.fillText(title, canvas.width / 2, canvas.height / 2);
      
      // 텍스처 생성
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      // 스프라이트 생성
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.1
      });
      
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(
        position.x,
        position.y + 0.4,
        position.z
      );
      sprite.scale.set(1.8, 0.45, 1);
      
      this.scene.add(sprite);
      this.textLabels.push({
        mesh: sprite,
        node: nodeData.mesh,
        originalPosition: sprite.position.clone()
      });
    });
  }
  
  /**
   * 한국어 폰트 렌더링 테스트
   */
  testKoreanFontRendering() {
    const testCanvas = document.createElement('canvas');
    const testContext = testCanvas.getContext('2d');
    testCanvas.width = 100;
    testCanvas.height = 50;
    
    const fontFamily = this.getKoreanFontFamily();
    testContext.font = `20px ${fontFamily}`;
    testContext.fillStyle = '#ffffff';
    testContext.fillText('한글', 25, 25);
    
    // 렌더링된 이미지 데이터 확인
    const imageData = testContext.getImageData(0, 0, 100, 50);
    const data = imageData.data;
    
    // 픽셀이 그려졌는지 확인 (alpha 채널 체크)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        return true; // 텍스트가 렌더링됨
      }
    }
    
    return false; // 텍스트 렌더링 실패
  }
  
  /**
   * HTML 오버레이 방식 텍스트 라벨 생성 (한국어 완벽 지원)
   */
  createHTMLTextLabels() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    this.nodes.forEach((nodeData) => {
      if (!nodeData.post) return;
      
      const post = nodeData.post;
      const title = post.title.length > 20 
        ? post.title.substring(0, 20) + '...' 
        : post.title;
      
      // HTML 텍스트 요소 생성 - Apple Design System
      const textElement = document.createElement('div');
      textElement.style.cssText = `
        position: absolute;
        color: #1d1d1f;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: -0.003em;
        background: rgba(255, 255, 255, 0.85);
        padding: 4px 8px;
        border-radius: 6px;
        border: 0.5px solid rgba(0, 0, 0, 0.04);
        pointer-events: none;
        z-index: 15;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        backdrop-filter: blur(20px) saturate(180%);
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        max-width: 160px;
        text-align: center;
        line-height: 1.1;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        will-change: transform, opacity;
      `;
      textElement.textContent = title;
      
      container.appendChild(textElement);
      
      // 3D 위치를 2D 화면 좌표로 변환하여 업데이트하는 함수
      const updatePosition = () => {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(nodeData.mesh.matrixWorld);
        vector.project(this.camera);
        
        // 화면 좌표 계산
        const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
        const y = (vector.y * -0.5 + 0.5) * container.clientHeight - 25; // 노드 위쪽에 표시
        
        textElement.style.left = x + 'px';
        textElement.style.top = y + 'px';
        
        // Apple-style progressive disclosure - 거리에 따른 선택적 표시
        const distance = this.camera.position.distanceTo(nodeData.mesh.position);
        const isNearCamera = distance < 12; // 가까이 있을 때만 표시
        const isInFront = vector.z < 1;
        const isInBounds = x > 50 && x < container.clientWidth - 50 && 
                          y > 50 && y < container.clientHeight - 50;
        
        const shouldShow = isNearCamera && isInFront && isInBounds;
        
        // Smooth fade with Apple's easing
        textElement.style.opacity = shouldShow ? '0.9' : '0';
        textElement.style.transform = shouldShow 
          ? 'translate(-50%, -50%) scale(1)' 
          : 'translate(-50%, -50%) scale(0.95)';
      };
      
      // 초기 위치 설정
      updatePosition();
      
      this.textLabels.push({
        mesh: { updatePosition },
        node: nodeData.mesh,
        htmlElement: textElement,
        originalPosition: nodeData.mesh.position.clone()
      });
    });
  }
  
  /**
   * 한국어 폰트 로딩 확인
   */
  async ensureKoreanFontLoaded() {
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
        // 한국어 폰트가 로드되었는지 확인
        await document.fonts.load('bold 28px "Noto Sans KR"');
      } catch (error) {
        console.warn('Font loading failed, using fallback fonts');
      }
    }
    
    // 약간의 지연을 두어 폰트 로딩 완료 대기
    return new Promise(resolve => setTimeout(resolve, 100));
  }
  
  /**
   * 한국어 지원 폰트 패밀리 반환
   */
  getKoreanFontFamily() {
    // 사용 가능한 폰트 확인 및 반환
    const fonts = [
      '"Noto Sans KR"',
      '"Apple SD Gothic Neo"',
      '"Malgun Gothic"',
      '"맑은 고딕"',
      '"나눔고딕"',
      '"Nanum Gothic"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ];
    
    return fonts.join(', ');
  }

  /**
   * 연결선 생성 - 뇌 영역간 연결과 태그 기반 연결
   */
  createConnections() {
    const themeColors = this.themeManager.getThemeColors();
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        const distance = nodeA.mesh.position.distanceTo(nodeB.mesh.position);
        
        let shouldConnect = false;
        let connectionStrength = 0.1;
        
        // 거리 기반 연결 - 더 짧은 거리로 조정
        if (distance < 2.5) {
          shouldConnect = Math.random() > 0.8;
          connectionStrength = 0.12;
        }
        
        // 태그 유사성 기반 연결
        if (nodeA.post && nodeB.post) {
          const tagsA = nodeA.post.tags || [];
          const tagsB = nodeB.post.tags || [];
          const commonTags = tagsA.filter(tag => tagsB.includes(tag));
          
          if (commonTags.length > 0) {
            shouldConnect = true;
            connectionStrength = 0.3 + (commonTags.length * 0.1);
          }
        }
        
        if (shouldConnect) {
          // 곡선 연결선 생성
          const start = nodeA.mesh.position;
          const end = nodeB.mesh.position;
          const midPoint = new THREE.Vector3()
            .addVectors(start, end)
            .multiplyScalar(0.5)
            .add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.5,
              (Math.random() - 0.5) * 0.5
            ));
          
          const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
          const points = curve.getPoints(20);
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          
          // 연결선 색상을 연결된 노드들의 태그 색상으로 설정
          const nodeAColor = nodeA.post ? this.themeManager.getColorByTags(nodeA.post.tags) : themeColors.connections;
          const nodeBColor = nodeB.post ? this.themeManager.getColorByTags(nodeB.post.tags) : themeColors.connections;
          
          // 두 노드의 평균 색상 계산
          const avgColor = this.averageColors(nodeAColor, nodeBColor);
          
          const material = new THREE.LineBasicMaterial({
            color: avgColor,
            transparent: true,
            opacity: connectionStrength
          });
          
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          this.connections.push({ 
            line, 
            material, 
            originalOpacity: connectionStrength,
            nodeA,
            nodeB
          });
        }
      }
    }
  }

  /**
   * 배경 파티클 생성
   */
  createParticles() {
    const themeColors = this.themeManager.getThemeColors();
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: themeColors.particles,
      size: 0.015,
      transparent: true,
      opacity: 0.5
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
  }

  /**
   * 상호작용 설정
   */
  setupInteractions() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // 마우스 이벤트
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      this.onMouseMove(event);
    });
    
    this.renderer.domElement.addEventListener('click', (event) => {
      this.onMouseClick(event);
    });
  }

  /**
   * 이벤트 바인딩
   */
  bindEvents() {
    // 테마 변경 이벤트
    window.addEventListener('themeChanged', (event) => {
      this.onThemeChanged(event.detail.isDarkTheme);
    });
    
    // 애니메이션 토글 이벤트
    window.addEventListener('animationToggled', (event) => {
      this.onAnimationToggled(event.detail.isAnimating);
    });
    
    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
      this.onWindowResize();
    });
  }

  /**
   * 마우스 움직임 처리
   */
  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodes.map(n => n.mesh));
    
    // 이전 호버 상태 초기화
    if (this.hoveredNode) {
      this.hoveredNode.material.color.setHex(this.hoveredNode.userData.originalColor);
      this.hoveredNode.scale.setScalar(1);
      if (this.tooltip) {
        this.tooltip.style.opacity = '0';
        this.tooltipTitle.textContent = '';
        this.tooltipTags.textContent = '';
      }
    }
    
    // 새 노드 호버 처리
    if (intersects.length > 0) {
      this.hoveredNode = intersects[0].object;
      if (this.hoveredNode.userData.post) {
        this.hoveredNode.material.color.setHex(0xffffff);
        this.hoveredNode.scale.setScalar(2.5);
        
        // 개선된 툴팁 표시
        if (this.tooltip && this.tooltipTitle && this.tooltipTags) {
          const post = this.hoveredNode.userData.post;
          
          // 제목 설정
          this.tooltipTitle.textContent = post.title;
          
          // 태그 설정
          if (post.tags && post.tags.length > 0) {
            this.tooltipTags.textContent = post.tags.join(', ');
          } else {
            this.tooltipTags.textContent = '태그 없음';
          }
          
          // 툴팁 위치 설정
          this.tooltip.style.left = (event.clientX + 15) + 'px';
          this.tooltip.style.top = (event.clientY - 15) + 'px';
          this.tooltip.style.opacity = '1';
        }
        
        document.body.style.cursor = 'pointer';
      }
    } else {
      this.hoveredNode = null;
      document.body.style.cursor = 'default';
    }
  }

  /**
   * 마우스 클릭 처리
   */
  onMouseClick(event) {
    if (this.hoveredNode && this.hoveredNode.userData.link) {
      window.location.href = this.hoveredNode.userData.link;
    }
  }

  /**
   * 테마 변경 처리
   */
  onThemeChanged(isDarkTheme) {
    const themeColors = this.themeManager.getThemeColors();
    
    // 배경색 변경
    this.renderer.setClearColor(themeColors.background, 1);
    
    // 연결선 색상 변경
    this.connections.forEach(conn => {
      conn.material.color.setHex(themeColors.connections);
      conn.material.opacity = themeColors.connectionOpacity;
    });
    
    // 파티클 색상 변경
    if (this.particles) {
      this.particles.material.color.setHex(themeColors.particles);
    }
    
    // 노드 색상 업데이트
    this.nodes.forEach(node => {
      if (node.mesh.userData.post) {
        const newColor = this.themeManager.getColorByTags(node.mesh.userData.post.tags);
        node.mesh.userData.originalColor = newColor;
        if (node.mesh !== this.hoveredNode) {
          node.mesh.material.color.setHex(newColor);
        }
        node.glow.material.color.setHex(newColor);
      } else {
        const dummyColor = themeColors.nodeColors.dummy;
        node.mesh.userData.originalColor = dummyColor;
        node.mesh.material.color.setHex(dummyColor);
        node.glow.material.color.setHex(dummyColor);
      }
    });
  }

  /**
   * 애니메이션 토글 처리
   */
  onAnimationToggled(isAnimating) {
    if (isAnimating && !this.animationId) {
      this.startAnimation();
    } else if (!isAnimating && this.animationId) {
      this.stopAnimation();
    }
  }

  /**
   * 윈도우 리사이즈 처리
   */
  onWindowResize() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 애니메이션 시작
   */
  startAnimation() {
    const animate = () => {
      if (this.controlsManager.getAnimationState()) {
        this.time += 0.008;
        this.updateAnimation();
        this.render();
        this.animationId = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  /**
   * 애니메이션 정지
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 애니메이션 업데이트 - 뇌파 같은 부드러운 움직임
   */
  updateAnimation() {
    // 부드러운 전체 회전
    this.scene.rotation.y = this.time * 0.05;
    this.scene.rotation.x = Math.sin(this.time * 0.2) * 0.03;
    
    // 노드 애니메이션
    this.nodes.forEach((nodeData, index) => {
      if (nodeData.mesh !== this.hoveredNode) {
        // 뇌파 같은 펄스
        const pulse = Math.sin(this.time * 1.5 + index * 0.3) * 0.03;
        nodeData.mesh.scale.setScalar(1 + pulse);
        
        // 중요도에 따른 추가 효과
        const importance = nodeData.mesh.userData.importance || 1;
        const importancePulse = Math.sin(this.time + index) * 0.01 * importance;
        nodeData.mesh.scale.addScalar(importancePulse);
      }
      
      // 글로우 효과 - 매우 미묘하게
      if (nodeData.glow) {
        const glowPulse = Math.sin(this.time * 0.8 + index * 0.3) * 0.05; // Much more subtle
        nodeData.glow.scale.setScalar(1.2 + glowPulse);
      }
      
      // Ring effects removed for cleaner design
    });
    
    // 연결선 에너지 흐름 효과
    this.connections.forEach((conn, index) => {
      const flow = Math.sin(this.time * 3 + index * 0.5) * 0.3;
      const opacity = conn.originalOpacity + flow * 0.2;
      conn.material.opacity = Math.max(0.05, Math.min(0.8, opacity));
    });
    
    // 텍스트 라벨 항상 카메라를 향하도록
    this.textLabels.forEach((label) => {
      if (label.htmlElement) {
        // HTML 오버레이 위치 업데이트
        label.mesh.updatePosition();
      } else if (label.mesh.lookAt) {
        // 3D 스프라이트 카메라 방향
        label.mesh.lookAt(this.camera.position);
        
        // 텍스트 부드러운 떠다니는 효과
        const float = Math.sin(this.time * 0.8 + label.node.position.x) * 0.05;
        label.mesh.position.y = label.originalPosition.y + float;
      }
    });
    
    // 파티클 회전
    if (this.particles) {
      this.particles.rotation.y = this.time * 0.01;
      this.particles.rotation.x = this.time * 0.005;
    }
  }

  /**
   * 렌더링
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 키보드 컨트롤 설정 (controlsManager에서 이미 처리되므로 불필요)
   */
  setupKeyboardControls() {
    // controlsManager가 이미 키보드 이벤트를 처리하므로 중복 제거
    // 마우스 휠은 controlsManager에서도 처리되므로 여기서는 제거
    console.log('Keyboard controls handled by ControlsManager');
  }
  
  /**
   * 두 색상의 평균 계산
   */
  averageColors(color1, color2) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    
    return new THREE.Color(
      (c1.r + c2.r) / 2,
      (c1.g + c2.g) / 2,
      (c1.b + c2.b) / 2
    );
  }
  
  /**
   * 정리
   */
  dispose() {
    this.stopAnimation();
    
    // HTML 텍스트 요소들 제거
    this.textLabels.forEach(label => {
      if (label.htmlElement) {
        label.htmlElement.remove();
      }
    });
    
    // THREE.js 객체들 정리
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // 키보드 이벤트는 controlsManager에서 관리
    
    // 이벤트 리스너 제거
    window.removeEventListener('themeChanged', this.onThemeChanged);
    window.removeEventListener('animationToggled', this.onAnimationToggled);
    window.removeEventListener('resize', this.onWindowResize);
  }
}
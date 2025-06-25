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
    
    // 네트워크 구조 설정
    this.layers = [
      { count: 6, radius: 2.5, z: -3 },
      { count: 8, radius: 3.5, z: -1 },
      { count: 10, radius: 4, z: 1 },
      { count: 6, radius: 3, z: 3 }
    ];
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
      this.createNetworkStructure();
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
    this.renderer.setClearColor(0x000000, 1);
    
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
  }

  /**
   * 네트워크 구조 생성
   */
  createNetworkStructure() {
    this.createNodes();
    this.createConnections();
    this.createParticles();
  }

  /**
   * 노드 생성
   */
  createNodes() {
    let nodeIndex = 0;
    const themeColors = this.themeManager.getThemeColors();
    
    this.layers.forEach((layer, layerIdx) => {
      for (let i = 0; i < layer.count; i++) {
        // 원형 배치 계산
        const angle = (i / layer.count) * Math.PI * 2;
        const x = Math.cos(angle) * layer.radius;
        const y = Math.sin(angle) * layer.radius;
        const z = layer.z + (Math.random() - 0.5) * 0.8;
        
        // 포스트 데이터 연결
        const post = this.postsData[nodeIndex] || null;
        
        // 색상 결정
        const color = post 
          ? this.themeManager.getColorByTags(post.tags)
          : themeColors.nodeColors.dummy;
        
        // 노드 생성
        const size = post ? 0.08 : 0.05;
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color });
        const node = new THREE.Mesh(geometry, material);
        node.position.set(x, y, z);
        
        // 메타데이터 저장
        node.userData = {
          post,
          originalColor: color,
          originalSize: size,
          link: post ? `/blog/${post.id}/` : null,
          title: post ? post.title : null,
          layerIndex: layerIdx,
          nodeIndex: i
        };
        
        // 글로우 효과
        const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: post ? 0.3 : 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(node.position);
        
        this.scene.add(node);
        this.scene.add(glow);
        this.nodes.push({ mesh: node, glow });
        
        if (post) nodeIndex++;
      }
    });
  }

  /**
   * 연결선 생성
   */
  createConnections() {
    const themeColors = this.themeManager.getThemeColors();
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const distance = this.nodes[i].mesh.position.distanceTo(this.nodes[j].mesh.position);
        
        // 거리 기반 연결 생성 (60% 확률)
        if (distance < 4 && Math.random() > 0.6) {
          const points = [this.nodes[i].mesh.position, this.nodes[j].mesh.position];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: themeColors.connections,
            transparent: true,
            opacity: themeColors.connectionOpacity
          });
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          this.connections.push({ line, material });
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
      size: 0.02,
      transparent: true,
      opacity: 0.3
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
   * 애니메이션 업데이트
   */
  updateAnimation() {
    // 전체 네트워크 회전
    this.scene.rotation.y = this.time * 0.1;
    this.scene.rotation.x = Math.sin(this.time * 0.3) * 0.05;
    
    // 노드 펄스 애니메이션
    this.nodes.forEach((node, index) => {
      if (node.mesh !== this.hoveredNode) {
        const pulse = Math.sin(this.time * 2 + index * 0.5) * 0.02;
        node.mesh.scale.setScalar(1 + pulse);
      }
      
      // 글로우 효과
      const glowPulse = Math.sin(this.time * 1.5 + index * 0.3) * 0.1;
      node.glow.scale.setScalar(1.2 + glowPulse);
    });
    
    // 연결선 깜빡임
    this.connections.forEach((conn, index) => {
      const baseOpacity = this.themeManager.getThemeColors().connectionOpacity;
      const opacity = baseOpacity + Math.sin(this.time * 2 + index * 0.2) * 0.1;
      conn.material.opacity = Math.max(0.05, opacity);
    });
    
    // 파티클 회전
    if (this.particles) {
      this.particles.rotation.y = this.time * 0.02;
      this.particles.rotation.x = this.time * 0.01;
    }
  }

  /**
   * 렌더링
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 정리
   */
  dispose() {
    this.stopAnimation();
    
    // THREE.js 객체들 정리
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // 이벤트 리스너 제거
    window.removeEventListener('themeChanged', this.onThemeChanged);
    window.removeEventListener('animationToggled', this.onAnimationToggled);
    window.removeEventListener('resize', this.onWindowResize);
  }
}
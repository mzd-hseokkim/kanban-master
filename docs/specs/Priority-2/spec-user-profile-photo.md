# spec-user-profile-photo — 사용자 프로필 사진 관리

## 1. 개요

사용자가 본인의 프로필 사진을 업로드하고, 조회하고, 변경하고, 삭제할 수 있는 기능을 구현한다.

- 백엔드의 파일 저장 시스템과 User 엔티티의 `avatarUrl` 필드를 활용하여 사진을 영구 저장한다.
- 프론트엔드에서 GlobalNavBar, 카드, 사용자 검색 등에서 프로필 사진을 표시한다.
- 파일 크기, 형식 검증 및 보안 처리를 통해 안전한 업로드를 보장한다.

## 2. 연계 요구사항

- FR-05a 프로필 사진 업로드
- FR-05b 프로필 사진 조회
- FR-05c 프로필 사진 변경
- FR-05d 프로필 사진 삭제
- NFR-05a 파일 크기 제한 (5MB)
- NFR-05b 이미지 형식 제한 (jpg, png, gif, webp)
- NFR-05c 보안 검증 (파일명 sanitization, MIME 타입 검증)

## 3. 주요 사용자 시나리오

### 시나리오 1: 최초 프로필 사진 업로드
1. 사용자가 GlobalNavBar의 프로필 드롭다운에서 "프로필 설정"을 클릭한다.
2. 프로필 설정 페이지에서 "프로필 사진 변경" 버튼을 클릭한다.
3. 파일 선택 다이얼로그에서 이미지 파일을 선택한다.
4. 선택한 이미지가 원형 미리보기로 표시된다.
5. "저장" 버튼을 클릭하면 백엔드에 업로드된다.
6. 성공 시 GlobalNavBar의 아바타가 업로드한 사진으로 즉시 변경된다.

### 시나리오 2: 프로필 사진 변경
1. 사용자가 이미 프로필 사진을 가지고 있다.
2. 프로필 설정 페이지에서 현재 사진이 표시된다.
3. "사진 변경" 버튼을 클릭하여 새 이미지를 선택한다.
4. 미리보기에서 새 이미지를 확인한다.
5. "저장" 버튼을 클릭하면 기존 파일이 삭제되고 새 파일이 업로드된다.
6. UI는 즉시 새 사진으로 업데이트된다.

### 시나리오 3: 프로필 사진 삭제
1. 사용자가 프로필 설정 페이지에서 "사진 삭제" 버튼을 클릭한다.
2. 확인 다이얼로그가 표시된다: "프로필 사진을 삭제하시겠습니까?"
3. "확인"을 클릭하면 서버에서 파일이 삭제되고 `avatarUrl`이 null로 설정된다.
4. GlobalNavBar의 아바타가 기본 상태(이름 첫 글자)로 돌아간다.

### 시나리오 4: 파일 검증 실패
1. 사용자가 10MB 크기의 이미지를 선택한다.
2. 클라이언트에서 즉시 검증하여 에러 메시지를 표시한다: "파일 크기는 5MB 이하여야 합니다"
3. 업로드 버튼이 비활성화된다.
4. 사용자가 PDF 파일을 선택하면: "지원하지 않는 파일 형식입니다 (jpg, png, gif, webp만 가능)"

### 시나리오 5: 프로필 사진 표시
1. GlobalNavBar에서 사용자 아바타가 원형으로 표시된다.
   - avatarUrl이 있으면 → 이미지 표시
   - avatarUrl이 없으면 → 그라데이션 배경에 이름 첫 글자
2. 카드에 할당된 사용자 프로필 사진이 작은 원형으로 표시된다.
3. 사용자 검색 결과에서 각 사용자의 프로필 사진이 표시된다.
4. 이미지 로딩 실패 시 자동으로 기본 아바타(이름 첫 글자)로 fallback 된다.

## 4. 디자인 가이드라인

### 프로필 사진 표시 영역

#### GlobalNavBar (크기: 40x40px)
```
┌──────────────────────────────────┐
│ Kanban Board       [🔍] [+] [👤] │
│                              ↑   │
│                         40x40px  │
│                      원형 아바타  │
└──────────────────────────────────┘
```

- 사진 있음: `<img>` 태그로 원형 표시 (`rounded-full`)
- 사진 없음: 그라데이션 배경 + 이름 첫 글자 (기존 방식)
- 호버: 밝기 증가 (`hover:brightness-110`)

#### 카드 담당자 (크기: 28x28px)
```
┌─────────────────────────────┐
│ 카드 제목                    │
│                              │
│ [👤] 홍길동            D-3   │
│  ↑                          │
│ 28x28px                     │
└─────────────────────────────┘
```

- 왼쪽 하단에 작은 원형 아바타
- 사진 있음: 원형 이미지
- 사진 없음: 그라데이션 + 이름 첫 글자

#### 프로필 설정 페이지 (크기: 120x120px)
```
┌─────────────────────────────────────┐
│ 프로필 설정                          │
│                                      │
│        ┌──────────┐                 │
│        │          │                 │
│        │  [사진]  │  120x120px      │
│        │          │                 │
│        └──────────┘                 │
│                                      │
│    [사진 변경]  [사진 삭제]         │
│                                      │
└─────────────────────────────────────┘
```

- 중앙 정렬된 큰 원형 아바타
- 버튼: `pastel-blue-500` 배경
- 삭제 버튼: `pastel-pink-500` 배경

### 파일 업로드 UI

```
┌─────────────────────────────────────┐
│ 프로필 사진 업로드                   │
│                                      │
│        ┌──────────┐                 │
│        │          │                 │
│        │ 미리보기 │                 │
│        │          │                 │
│        └──────────┘                 │
│                                      │
│        [파일 선택]                  │
│                                      │
│    선택된 파일: profile.jpg         │
│    크기: 2.3 MB                     │
│                                      │
│         [취소]  [업로드]            │
│                                      │
└─────────────────────────────────────┘
```

- 미리보기: 선택 즉시 표시
- 진행 상태: 업로드 중 progress bar
- 성공: 초록색 체크 아이콘 + "업로드 완료"
- 실패: 빨간색 X 아이콘 + 에러 메시지

### 애니메이션

- **이미지 로드**: 200ms fade-in
- **업로드 진행**: Spinner 회전 애니메이션
- **성공/실패**: 300ms 슬라이드 인
- **아바타 변경**: 500ms cross-fade

### 에러 상황

```
┌─────────────────────────────────┐
│ ⚠️ 파일 크기는 5MB 이하여야    │
│    합니다                        │ ← 토스트 (3초 후 사라짐)
└─────────────────────────────────┘
```

**에러 메시지:**
- 파일 크기 초과: "파일 크기는 5MB 이하여야 합니다"
- 형식 오류: "지원하지 않는 파일 형식입니다 (jpg, png, gif, webp만 가능)"
- 업로드 실패: "파일 업로드에 실패했습니다. 다시 시도해주세요"
- 삭제 실패: "프로필 사진 삭제에 실패했습니다"
- 네트워크 오류: "네트워크 연결을 확인해주세요"

**토스트 스타일:**
- 배경: `pastel-pink-500` (에러), `pastel-green-500` (성공)
- 텍스트: 흰색
- 위치: 화면 우측 상단
- 자동 사라짐: 3초 후

## 5. 프론트엔드 규격

### 페이지/컴포넌트 구조

#### 1. ProfilePhotoUpload.tsx (신규 생성)

**역할:** 프로필 사진 업로드/변경/삭제 UI

**Props:**
```typescript
interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess: (newAvatarUrl: string) => void;
  onDeleteSuccess: () => void;
}
```

**상태:**
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [error, setError] = useState<string | null>(null);
```

**핵심 로직:**
```
파일 선택
  ↓
클라이언트 검증 (크기, 형식)
  ↓
미리보기 생성 (FileReader API)
  ↓
사용자 확인
  ↓
업로드 버튼 클릭
  ↓
FormData 생성
  ↓
POST /api/v1/users/profile/avatar
  ↓
성공: avatarUrl 반환 → UI 업데이트 → 토스트 표시
실패: 에러 메시지 표시 → 파일 선택 초기화
```

**파일 검증:**
```typescript
const validateFile = (file: File): string | null => {
  // 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return "파일 크기는 5MB 이하여야 합니다";
  }

  // 형식 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return "지원하지 않는 파일 형식입니다 (jpg, png, gif, webp만 가능)";
  }

  return null; // 검증 통과
};
```

#### 2. Avatar.tsx (신규 생성)

**역할:** 재사용 가능한 아바타 컴포넌트

**Props:**
```typescript
interface AvatarProps {
  avatarUrl?: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';  // 28, 40, 80, 120px
  className?: string;
}
```

**크기 매핑:**
```typescript
const sizeMap = {
  sm: 'w-7 h-7 text-xs',      // 28px - 카드
  md: 'w-10 h-10 text-sm',    // 40px - GlobalNavBar
  lg: 'w-20 h-20 text-lg',    // 80px - 사용자 검색
  xl: 'w-30 h-30 text-2xl',   // 120px - 프로필 설정
};
```

**렌더링 로직:**
```typescript
if (avatarUrl) {
  return (
    <img
      src={avatarUrl}
      alt={`${userName}의 프로필 사진`}
      className={`${sizeMap[size]} rounded-full object-cover`}
      onError={(e) => {
        // 이미지 로드 실패 시 fallback
        e.currentTarget.style.display = 'none';
        // 기본 아바타 표시
      }}
    />
  );
} else {
  // 그라데이션 배경 + 이름 첫 글자
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-pastel-blue-400 to-pastel-purple-400 flex items-center justify-center text-white font-semibold`}>
      {userName.charAt(0).toUpperCase()}
    </div>
  );
}
```

#### 3. GlobalNavBar.tsx (수정)

**변경점:**
- 기존 아바타 렌더링 로직을 `Avatar` 컴포넌트로 교체

**Before:**
```typescript
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-pastel-blue-400 to-pastel-purple-400 flex items-center justify-center text-white font-semibold">
  {user.name.charAt(0)}
</div>
```

**After:**
```typescript
<Avatar
  avatarUrl={user.avatarUrl}
  userName={user.name}
  size="md"
/>
```

#### 4. userService.ts (확장)

**기존 함수:**
- `getCurrentUser()`
- `updateUserProfile(request)`
- `searchUsers(query)`

**신규 함수:**
```typescript
/**
 * 프로필 사진 업로드
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ avatarUrl: string }>(
    '/api/v1/users/profile/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        // 진행률 계산 (선택사항)
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    }
  );

  return response.data.avatarUrl;
};

/**
 * 프로필 사진 삭제
 */
export const deleteAvatar = async (): Promise<void> => {
  await api.delete('/api/v1/users/profile/avatar');
};
```

### 상태 관리

**AuthContext 확장:**
```typescript
interface AuthContextType {
  user: UserProfile | null;
  // ... 기존 함수들
  updateAvatar: (avatarUrl: string) => void;
  removeAvatar: () => void;
}

const updateAvatar = (avatarUrl: string) => {
  setUser(prev => prev ? { ...prev, avatarUrl } : null);
};

const removeAvatar = () => {
  setUser(prev => prev ? { ...prev, avatarUrl: null } : null);
};
```

### 에러 처리

**클라이언트 검증:**
```typescript
const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const validationError = validateFile(file);
  if (validationError) {
    setError(validationError);
    showToast(validationError, 'error', 3000);
    return;
  }

  setSelectedFile(file);
  setError(null);
  generatePreview(file);
};
```

**서버 에러 처리:**
```typescript
const handleUpload = async () => {
  if (!selectedFile) return;

  setIsUploading(true);
  setError(null);

  try {
    const newAvatarUrl = await uploadAvatar(selectedFile);
    onUploadSuccess(newAvatarUrl);
    showToast('프로필 사진이 업로드되었습니다', 'success', 3000);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '파일 업로드에 실패했습니다';
    setError(errorMessage);
    showToast(errorMessage, 'error', 3000);
  } finally {
    setIsUploading(false);
  }
};
```

## 6. 백엔드 규격

### API 엔드포인트

#### 1. 프로필 사진 업로드

```
POST /api/v1/users/profile/avatar
Content-Type: multipart/form-data

요청 본문:
- file: (binary) 이미지 파일

응답 (200 OK):
{
  "avatarUrl": "http://localhost:8080/uploads/avatars/user-123/abc123-profile.jpg",
  "uploadedAt": "2024-11-10T14:30:00"
}

에러 응답:
400 Bad Request - 파일 검증 실패
{
  "message": "파일 크기는 5MB 이하여야 합니다",
  "code": "FILE_TOO_LARGE"
}

401 Unauthorized - 인증 실패
{
  "message": "인증이 필요합니다",
  "code": "UNAUTHORIZED"
}

415 Unsupported Media Type - 형식 오류
{
  "message": "지원하지 않는 파일 형식입니다",
  "code": "UNSUPPORTED_FILE_TYPE"
}

500 Internal Server Error - 저장 실패
{
  "message": "파일 저장에 실패했습니다",
  "code": "FILE_STORAGE_ERROR"
}
```

#### 2. 프로필 사진 삭제

```
DELETE /api/v1/users/profile/avatar

응답 (204 No Content):
(응답 본문 없음)

에러 응답:
401 Unauthorized - 인증 실패
404 Not Found - 삭제할 사진이 없음
500 Internal Server Error - 삭제 실패
```

#### 3. 프로필 사진 조회 (정적 리소스)

```
GET /uploads/avatars/{userId}/{filename}

응답 (200 OK):
Content-Type: image/jpeg (또는 image/png, image/gif, image/webp)
(이미지 바이너리 데이터)

에러 응답:
404 Not Found - 파일이 존재하지 않음
```

### 파일 저장 전략

#### 디렉토리 구조
```
/uploads/
  └─ avatars/
      ├─ user-1/
      │   └─ abc123-profile.jpg
      ├─ user-2/
      │   └─ def456-profile.png
      └─ user-3/
          └─ ghi789-profile.webp
```

- 사용자별로 디렉토리 분리 (`user-{userId}`)
- 파일명: `{UUID}-profile.{확장자}`
- 기존 파일이 있으면 삭제 후 새 파일 저장

#### 파일 저장 서비스 (FileStorageService.java)

```java
@Service
public class FileStorageService {

    @Value("${file.upload.path:/uploads/avatars}")
    private String uploadPath;

    /**
     * 프로필 사진 저장
     * @param userId 사용자 ID
     * @param file 업로드된 파일
     * @return 저장된 파일의 URL
     */
    public String saveAvatar(Long userId, MultipartFile file) {
        // 1. 사용자별 디렉토리 생성
        Path userDir = Paths.get(uploadPath, "user-" + userId);
        Files.createDirectories(userDir);

        // 2. 기존 파일 삭제
        deleteExistingAvatar(userId);

        // 3. 파일명 생성 (UUID + 확장자)
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "-profile." + extension;

        // 4. 파일 저장
        Path filePath = userDir.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        // 5. URL 반환
        return "/uploads/avatars/user-" + userId + "/" + filename;
    }

    /**
     * 프로필 사진 삭제
     */
    public void deleteAvatar(Long userId, String avatarUrl) {
        if (avatarUrl == null) return;

        Path filePath = Paths.get(uploadPath, extractPathFromUrl(avatarUrl));
        Files.deleteIfExists(filePath);
    }
}
```

### 파일 검증

#### 크기 검증
```yaml
application.yml:
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 5MB
```

#### 형식 검증 (Java)
```java
@Component
public class FileValidator {

    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    );

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB

    public void validateImageFile(MultipartFile file) {
        // 크기 검증
        if (file.getSize() > MAX_SIZE) {
            throw new FileTooLargeException("파일 크기는 5MB 이하여야 합니다");
        }

        // MIME 타입 검증
        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new UnsupportedFileTypeException(
                "지원하지 않는 파일 형식입니다 (jpg, png, gif, webp만 가능)"
            );
        }

        // 파일명 검증 (확장자)
        String filename = file.getOriginalFilename();
        if (filename == null || !hasValidExtension(filename)) {
            throw new InvalidFileException("유효하지 않은 파일입니다");
        }
    }

    private boolean hasValidExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return List.of("jpg", "jpeg", "png", "gif", "webp").contains(extension);
    }
}
```

### 보안 처리

#### 파일명 Sanitization
```java
public String sanitizeFilename(String originalFilename) {
    // 경로 탐색 방지 (../, ..\, 등)
    String sanitized = originalFilename.replaceAll("\\.\\./", "");
    sanitized = sanitized.replaceAll("\\.\\\\", "");

    // 특수 문자 제거
    sanitized = sanitized.replaceAll("[^a-zA-Z0-9\\.\\-_]", "");

    return sanitized;
}
```

#### CSRF 보호
- Spring Security의 기본 CSRF 보호 활용
- multipart/form-data 요청에도 CSRF 토큰 포함

#### 인증 확인
```java
@PostMapping("/profile/avatar")
public ResponseEntity<AvatarUploadResponse> uploadAvatar(
    @RequestParam("file") MultipartFile file,
    @AuthenticationPrincipal User currentUser
) {
    // currentUser는 Spring Security가 자동 주입
    // 인증되지 않은 사용자는 401 반환

    // 본인의 프로필 사진만 업로드 가능
    // ...
}
```

### User 엔티티 업데이트

**UserService.java:**
```java
@Service
public class UserService {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    /**
     * 프로필 사진 업데이트
     */
    @Transactional
    public String updateAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다"));

        // 기존 파일 삭제
        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteAvatar(userId, user.getAvatarUrl());
        }

        // 새 파일 저장
        String newAvatarUrl = fileStorageService.saveAvatar(userId, file);

        // DB 업데이트
        user.setAvatarUrl(newAvatarUrl);
        userRepository.save(user);

        return newAvatarUrl;
    }

    /**
     * 프로필 사진 삭제
     */
    @Transactional
    public void deleteAvatar(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다"));

        if (user.getAvatarUrl() != null) {
            fileStorageService.deleteAvatar(userId, user.getAvatarUrl());
            user.setAvatarUrl(null);
            userRepository.save(user);
        }
    }
}
```

### 정적 리소스 제공

**WebMvcConfig.java:**
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.path:/uploads/avatars}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry
            .addResourceHandler("/uploads/avatars/**")
            .addResourceLocations("file:" + uploadPath + "/");
    }
}
```

## 7. 수용 기준

1. 사용자가 5MB 이하의 이미지 파일(jpg, png, gif, webp)을 업로드할 수 있다.
2. 업로드 즉시 GlobalNavBar의 아바타가 업로드한 사진으로 변경된다.
3. 프로필 설정 페이지에서 현재 프로필 사진을 미리볼 수 있다.
4. 사용자가 프로필 사진을 변경하면 기존 파일이 삭제되고 새 파일이 저장된다.
5. 사용자가 프로필 사진을 삭제하면 서버에서 파일이 삭제되고 기본 아바타로 돌아간다.
6. 파일 크기가 5MB를 초과하면 업로드가 거부되고 명확한 에러 메시지가 표시된다.
7. 지원하지 않는 파일 형식(pdf, txt 등)은 업로드가 거부된다.
8. 이미지 로딩 실패 시 자동으로 기본 아바타(이름 첫 글자)로 fallback 된다.
9. 카드, 사용자 검색 등 모든 사용자 표시 영역에서 프로필 사진이 일관되게 표시된다.
10. 인증되지 않은 사용자는 프로필 사진을 업로드하거나 삭제할 수 없다.

## 8. 구현 순서

### Phase 1: 백엔드 기반 구축 (1.5일)
- [ ] `FileStorageService.java` 생성 (파일 저장/삭제 로직)
- [ ] `FileValidator.java` 생성 (크기/형식 검증)
- [ ] `application.yml` 설정 (업로드 경로, 크기 제한)
- [ ] `WebMvcConfig.java` 수정 (정적 리소스 제공)
- [ ] `UserController.java` 확장 (POST/DELETE /profile/avatar 엔드포인트)
- [ ] `UserService.java` 확장 (avatarUrl 업데이트/삭제 로직)

### Phase 2: 백엔드 테스트 (1일)
- [ ] 파일 업로드 API 테스트
- [ ] 파일 삭제 API 테스트
- [ ] 파일 검증 로직 테스트 (크기, 형식)
- [ ] 보안 테스트 (인증, 파일명 sanitization)

### Phase 3: 프론트엔드 컴포넌트 구현 (2일)
- [ ] `Avatar.tsx` 컴포넌트 생성
- [ ] `ProfilePhotoUpload.tsx` 컴포넌트 생성
- [ ] `GlobalNavBar.tsx` 수정 (Avatar 컴포넌트 통합)
- [ ] `userService.ts` 확장 (uploadAvatar, deleteAvatar 함수)
- [ ] `AuthContext.tsx` 확장 (updateAvatar, removeAvatar 함수)

### Phase 4: 프로필 설정 페이지 (1.5일)
- [ ] 프로필 설정 페이지 생성 또는 확장
- [ ] ProfilePhotoUpload 컴포넌트 통합
- [ ] 파일 선택 UI
- [ ] 미리보기 UI
- [ ] 업로드 진행 상태 표시

### Phase 5: UX 개선 (1일)
- [ ] 토스트 알림 구현 (성공/실패)
- [ ] 이미지 로딩 상태 표시 (spinner)
- [ ] 이미지 로딩 실패 시 fallback 처리
- [ ] 애니메이션 (fade-in, cross-fade)
- [ ] 반응형 디자인 (모바일 지원)

### Phase 6: 통합 및 테스트 (1.5일)
- [ ] 컴포넌트 단위 테스트
- [ ] 통합 테스트 (업로드 → 표시 플로우)
- [ ] E2E 테스트 (전체 사용자 시나리오)
- [ ] 브라우저 호환성 테스트
- [ ] 접근성 테스트 (alt 텍스트, 키보드 네비게이션)

**총 소요 시간: ~8.5일**

## 9. 위험 요소 및 완화 전략

| 위험 | 영향 | 완화 전략 |
|------|------|----------|
| 파일 시스템 용량 부족 | 업로드 실패 | 디스크 사용량 모니터링, 주기적인 정리 |
| 악성 파일 업로드 | 보안 취약점 | MIME 타입 검증, 파일명 sanitization, 바이러스 스캔 (추후) |
| 대용량 동시 업로드 | 서버 과부하 | 업로드 속도 제한, 큐 시스템 도입 (추후) |
| 이미지 로딩 실패 | UX 저하 | Fallback 처리, CDN 도입 (추후) |
| 파일 삭제 실패 | 디스크 낭비 | 배치 작업으로 고아 파일 정리 (추후) |

## 10. 테스트 전략

### Unit Tests

**백엔드:**
- FileValidator: 크기/형식 검증 로직
- FileStorageService: 파일 저장/삭제/경로 생성
- UserService: avatarUrl 업데이트/삭제 로직

**프론트엔드:**
- Avatar 컴포넌트: 사진 유무에 따른 렌더링
- validateFile 함수: 클라이언트 검증 로직
- ProfilePhotoUpload: 파일 선택/미리보기/업로드

### Integration Tests

```
백엔드:
1. POST /api/v1/users/profile/avatar
   - 정상 업로드 → 200 OK + avatarUrl 반환
   - 파일 크기 초과 → 400 Bad Request
   - 형식 오류 → 415 Unsupported Media Type
   - 인증 실패 → 401 Unauthorized

2. DELETE /api/v1/users/profile/avatar
   - 정상 삭제 → 204 No Content
   - 인증 실패 → 401 Unauthorized

3. GET /uploads/avatars/{userId}/{filename}
   - 정상 조회 → 200 OK + 이미지 반환
   - 파일 없음 → 404 Not Found

프론트엔드:
1. 업로드 플로우
   - 파일 선택 → 미리보기 → 업로드 → UI 업데이트
2. 삭제 플로우
   - 삭제 확인 → API 호출 → 기본 아바타로 복원
3. 에러 처리
   - 클라이언트 검증 실패 → 에러 메시지 표시
   - 서버 에러 → 토스트 알림 표시
```

### E2E Tests (Playwright)

```
시나리오 1: 최초 프로필 사진 업로드
  1. 로그인
  2. 프로필 설정 페이지로 이동
  3. 파일 선택 (2MB jpg 파일)
  4. 미리보기 확인
  5. 업로드 버튼 클릭
  6. 성공 토스트 확인
  7. GlobalNavBar 아바타 변경 확인

시나리오 2: 프로필 사진 변경
  1. 기존 프로필 사진이 있는 사용자로 로그인
  2. 프로필 설정 페이지에서 현재 사진 확인
  3. 새 파일 선택
  4. 업로드 후 변경된 사진 확인

시나리오 3: 프로필 사진 삭제
  1. 삭제 버튼 클릭
  2. 확인 다이얼로그에서 확인
  3. 기본 아바타로 복원 확인

시나리오 4: 파일 검증 실패
  1. 10MB 파일 선택 → 에러 메시지 확인
  2. PDF 파일 선택 → 에러 메시지 확인
  3. 업로드 버튼 비활성화 확인

시나리오 5: 이미지 로딩 fallback
  1. 네트워크를 오프라인으로 전환
  2. 프로필 사진이 있는 페이지 로드
  3. 기본 아바타로 fallback 확인
```

### 성능 테스트

- 파일 업로드 시간: 5MB 파일 기준 3초 이내
- 이미지 로딩 시간: 100ms 이내 (캐시 없이)
- 동시 업로드: 10명 동시 업로드 시 서버 응답 시간 5초 이내

## 11. Notes

- **프로덕션 환경**: 추후 AWS S3, Cloudinary 등 클라우드 스토리지로 마이그레이션 권장
- **이미지 최적화**: 추후 썸네일 생성, WebP 변환, CDN 연동 고려
- **프라이버시**: 사용자가 프로필 사진 공개 범위를 설정할 수 있는 기능 추가 고려 (Priority-3)
- **모바일**: 모바일 브라우저에서 카메라로 직접 촬영 지원 고려 (Priority-3)
- **배치 작업**: 고아 파일(DB에는 없지만 파일 시스템에 남은 파일) 정리 배치 작업 필요
- **기본 아바타**: 현재는 그라데이션 + 이름 첫 글자. 추후 디자인 시스템에 맞춰 커스터마이징 가능

## 12. Related Documents

- `../Priority-1/model-users-001.md` - User 엔티티 정의
- `../Priority-1/api-spec.md` - API 명세 참조
- `../Priority-1/frontend-design.md` - 프론트엔드 디자인 시스템
- `CLAUDE.md` - 프로젝트 전체 가이드라인

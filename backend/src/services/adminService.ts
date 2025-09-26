import bcrypt from 'bcryptjs';
import { query } from '../config/database';

export interface AdminCreationResult {
  success: boolean;
  message: string;
  adminExists?: boolean;
  created?: boolean;
}

/**
 * 환경변수를 사용해서 어드민 계정을 동적으로 생성하는 서비스
 */
export class AdminService {
  
  /**
   * 어드민 계정이 이미 존재하는지 확인
   */
  private static async adminExists(): Promise<boolean> {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND username = ?',
        ['admin', process.env.ADMIN_USERNAME || 'admin']
      ) as any[];
      
      return result[0].count > 0;
    } catch (error) {
      console.error('❌ Error checking admin existence:', error);
      throw error;
    }
  }

  /**
   * 어드민 계정 생성
   */
  private static async createAdminAccount(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const adminName = process.env.ADMIN_NAME || '시스템 관리자';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@a1studylink.com';

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    try {
      await query(
        `INSERT INTO users (
          username, 
          password, 
          role, 
          name, 
          email, 
          is_approved, 
          is_active,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          adminUsername,
          hashedPassword,
          'admin',
          adminName,
          adminEmail,
          true,
          true
        ]
      );

      console.log(`✅ Admin account created successfully:`);
      console.log(`   - Username: ${adminUsername}`);
      console.log(`   - Name: ${adminName}`);
      console.log(`   - Email: ${adminEmail}`);
      console.log(`   - Password: [HIDDEN]`);
    } catch (error) {
      console.error('❌ Error creating admin account:', error);
      throw error;
    }
  }

  /**
   * 어드민 계정 비밀번호 업데이트 (비밀번호가 변경된 경우)
   */
  private static async updateAdminPassword(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    // 현재 저장된 비밀번호 해시 가져오기
    const result = await query(
      'SELECT password FROM users WHERE role = ? AND username = ?',
      ['admin', adminUsername]
    ) as any[];

    if (result.length === 0) {
      throw new Error('Admin user not found');
    }

    const currentHash = result[0].password;
    
    // 비밀번호가 변경되었는지 확인
    const passwordMatches = await bcrypt.compare(adminPassword, currentHash);
    
    if (!passwordMatches) {
      // 비밀번호가 변경되었으므로 업데이트
      const newHash = await bcrypt.hash(adminPassword, 12);
      
      await query(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE role = ? AND username = ?',
        [newHash, 'admin', adminUsername]
      );
      
      console.log(`🔄 Admin password updated for user: ${adminUsername}`);
    }
  }

  /**
   * 어드민 계정 초기화 및 생성 메인 메서드
   */
  public static async initializeAdminAccount(): Promise<AdminCreationResult> {
    try {
      console.log('🔍 Checking admin account status...');
      
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      
      // 환경변수 검증
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
        console.warn('⚠️  Admin credentials not found in environment variables, using defaults');
      }

      const exists = await this.adminExists();
      
      if (exists) {
        console.log(`✅ Admin account already exists: ${adminUsername}`);
        
        // 비밀번호가 변경되었는지 확인하고 업데이트
        await this.updateAdminPassword();
        
        return {
          success: true,
          message: 'Admin account already exists and verified',
          adminExists: true,
          created: false
        };
      } else {
        console.log(`🔧 Creating new admin account: ${adminUsername}`);
        await this.createAdminAccount();
        
        return {
          success: true,
          message: 'Admin account created successfully',
          adminExists: false,
          created: true
        };
      }
    } catch (error) {
      console.error('❌ Failed to initialize admin account:', error);
      return {
        success: false,
        message: `Failed to initialize admin account: ${error instanceof Error ? error.message : 'Unknown error'}`,
        adminExists: false,
        created: false
      };
    }
  }

  /**
   * 어드민 계정 정보 조회 (디버깅용)
   */
  public static async getAdminInfo(): Promise<any> {
    try {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const result = await query(
        'SELECT id, username, name, email, role, is_approved, is_active, created_at, updated_at FROM users WHERE role = ? AND username = ?',
        ['admin', adminUsername]
      ) as any[];
      
      return result[0] || null;
    } catch (error) {
      console.error('❌ Error getting admin info:', error);
      return null;
    }
  }
}

export default AdminService;
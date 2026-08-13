import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

class PostgresStore {
  private pool: pg.Pool | null = null;
  public isConnected: boolean = false;

  constructor() {
    this.initPool();
  }

  private initPool() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('[PostgresStore] DATABASE_URL not configured. Running in JSON file store fallback mode.');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err) => {
        console.error('[PostgresStore] Unexpected pool error:', err);
      });

      this.testConnection();
    } catch (err) {
      console.error('[PostgresStore] Failed to initialize PostgreSQL pool:', err);
      this.pool = null;
      this.isConnected = false;
    }
  }

  public async testConnection(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      const res = await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      console.log(`[PostgresStore] Connected to PostgreSQL successfully at ${res.rows[0].now}`);
      await this.ensureTablesAndSeed();
      return true;
    } catch (err: any) {
      console.error('[PostgresStore] PostgreSQL connection failed:', err.message);
      this.isConnected = false;
      return false;
    }
  }

  private async ensureTablesAndSeed() {
    if (!this.pool) return;

    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          roll_number VARCHAR(50) UNIQUE NOT NULL,
          department VARCHAR(255) NOT NULL,
          program VARCHAR(100) NOT NULL,
          year INT NOT NULL CHECK (year >= 1 AND year <= 5),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faculty (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          employee_id VARCHAR(50) UNIQUE NOT NULL,
          department VARCHAR(255) NOT NULL,
          designation VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(100) PRIMARY KEY,
          course_code VARCHAR(50) UNIQUE NOT NULL,
          course_name VARCHAR(255) NOT NULL,
          description TEXT,
          credits INT NOT NULL CHECK (credits > 0),
          department VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS semesters (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          academic_year VARCHAR(50) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          registration_open BOOLEAN DEFAULT FALSE,
          registration_close TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS course_offerings (
          id VARCHAR(100) PRIMARY KEY,
          course_id VARCHAR(100) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          faculty_id VARCHAR(100) NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
          semester_id VARCHAR(100) NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
          capacity INT NOT NULL CHECK (capacity > 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(course_id, semester_id)
      );

      CREATE TABLE IF NOT EXISTS registrations (
          id VARCHAR(100) PRIMARY KEY,
          student_id VARCHAR(100) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          course_offering_id VARCHAR(100) NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
          registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'dropped')),
          UNIQUE(student_id, course_offering_id)
      );

      CREATE TABLE IF NOT EXISTS grades (
          id VARCHAR(100) PRIMARY KEY,
          registration_id VARCHAR(100) UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
          grade VARCHAR(5) NOT NULL CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F')),
          grade_point NUMERIC(3, 1) NOT NULL,
          uploaded_by VARCHAR(100) NOT NULL REFERENCES faculty(id),
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.pool.query(createTablesQuery);
      console.log('[PostgresStore] Verified schema and table structure.');

      // Check if user seed exists
      const userCountRes = await this.pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0) {
        console.log('[PostgresStore] Seeding initial database records into PostgreSQL...');
        await this.seedDatabase();
      }
    } catch (err: any) {
      console.error('[PostgresStore] Schema verification/seeding failed:', err.message);
    }
  }

  public async seedDatabase() {
    if (!this.pool) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const salt = bcrypt.genSaltSync(10);
      const commonPasswordHash = bcrypt.hashSync('Password123!', salt);
      const now = new Date().toISOString();

      // Insert Users
      const users = [
        ['u-std-1', 'Aravind Swaminathan', 'student1@iitm.ac.in', commonPasswordHash, 'student'],
        ['u-std-2', 'Ananya Sharma', 'student2@iitm.ac.in', commonPasswordHash, 'student'],
        ['u-fac-1', 'Prof. Ramesh Chandra', 'faculty1@iitm.ac.in', commonPasswordHash, 'faculty'],
        ['u-fac-2', 'Prof. Sunita Krishnan', 'faculty2@iitm.ac.in', commonPasswordHash, 'faculty'],
      ];

      for (const u of users) {
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $6) ON CONFLICT (email) DO NOTHING`,
          [...u, now]
        );
      }

      // Insert Students
      await client.query(
        `INSERT INTO students (id, user_id, roll_number, department, program, year, created_at)
         VALUES 
         ('std-1', 'u-std-1', 'BE21B001', 'Computer Science & Engineering', 'B.Tech', 3, $1),
         ('std-2', 'u-std-2', 'CS22M005', 'Computer Science & Engineering', 'M.Tech', 2, $1)
         ON CONFLICT (id) DO NOTHING`,
        [now]
      );

      // Insert Faculty
      await client.query(
        `INSERT INTO faculty (id, user_id, employee_id, department, designation, created_at)
         VALUES 
         ('fac-1', 'u-fac-1', 'FAC101', 'Computer Science & Engineering', 'Professor & HOD', $1),
         ('fac-2', 'u-fac-2', 'FAC102', 'Computer Science & Engineering', 'Associate Professor', $1)
         ON CONFLICT (id) DO NOTHING`,
        [now]
      );

      // Insert Courses
      await client.query(
        `INSERT INTO courses (id, course_code, course_name, description, credits, department, created_at)
         VALUES 
         ('c-1', 'CS1010', 'Introduction to Programming', 'Fundamental principles of programming.', 4, 'Computer Science & Engineering', $1),
         ('c-2', 'CS3100', 'Data Structures and Algorithms', 'Arrays, trees, graphs, and asymptotic runtime.', 4, 'Computer Science & Engineering', $1),
         ('c-3', 'CS4200', 'Database Systems', 'Relational algebra, SQL, B-Trees, and transactions.', 4, 'Computer Science & Engineering', $1)
         ON CONFLICT (id) DO NOTHING`,
        [now]
      );

      // Insert Semester
      await client.query(
        `INSERT INTO semesters (id, name, academic_year, start_date, end_date, registration_open, registration_close)
         VALUES 
         ('sem-2026-jul', 'July - November 2026 (Monsoon)', '2026-2027', '2026-07-25', '2026-11-30', TRUE, '2026-09-15T23:59:59Z')
         ON CONFLICT (id) DO NOTHING`
      );

      // Insert Course Offerings
      await client.query(
        `INSERT INTO course_offerings (id, course_id, faculty_id, semester_id, capacity, created_at)
         VALUES 
         ('co-cs3100-2026jul', 'c-2', 'fac-1', 'sem-2026-jul', 60, $1),
         ('co-cs4200-2026jul', 'c-3', 'fac-2', 'sem-2026-jul', 50, $1)
         ON CONFLICT (id) DO NOTHING`,
        [now]
      );

      await client.query('COMMIT');
      console.log('[PostgresStore] Seed data successfully populated.');
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[PostgresStore] Seed population error:', err.message);
    } finally {
      client.release();
    }
  }

  public getPool(): pg.Pool | null {
    return this.pool;
  }
}

export const postgresStore = new PostgresStore();

/**
 * CRAN 镜像源管理工具
 * 根据用户地理位置自动选择最近的镜像源
 */

export interface CRANMirror {
  name: string;
  url: string;
  country: string;
  city?: string;
  priority: number; // 优先级，数字越小越优先
}

// 全球主要 CRAN 镜像源列表（按地理位置分组）
export const CRAN_MIRRORS: CRANMirror[] = [
  // 中国镜像（最高优先级，适合中国用户）
  { name: '清华大学', url: 'https://mirrors.tuna.tsinghua.edu.cn/CRAN/', country: 'CN', city: 'Beijing', priority: 1 },
  { name: '中国科技大学', url: 'https://mirrors.ustc.edu.cn/CRAN/', country: 'CN', city: 'Hefei', priority: 2 },
  { name: '阿里云', url: 'https://mirrors.aliyun.com/CRAN/', country: 'CN', city: 'Hangzhou', priority: 3 },
  { name: '兰州大学', url: 'https://mirror.lzu.edu.cn/CRAN/', country: 'CN', city: 'Lanzhou', priority: 4 },
  
  // 亚洲其他地区
  { name: 'Japan (Tokyo)', url: 'https://cran.ism.ac.jp/', country: 'JP', city: 'Tokyo', priority: 10 },
  { name: 'Korea (Seoul)', url: 'https://cran.seoul.go.kr/', country: 'KR', city: 'Seoul', priority: 11 },
  { name: 'Singapore', url: 'https://cran.stat.nus.edu.sg/', country: 'SG', city: 'Singapore', priority: 12 },
  
  // 欧洲
  { name: 'UK (Bristol)', url: 'https://www.stats.bris.ac.uk/R/', country: 'GB', city: 'Bristol', priority: 20 },
  { name: 'Germany (Münster)', url: 'https://ftp.gwdg.de/pub/misc/cran/', country: 'DE', city: 'Münster', priority: 21 },
  { name: 'France (Lyon)', url: 'https://cran.univ-lyon1.fr/', country: 'FR', city: 'Lyon', priority: 22 },
  
  // 北美
  { name: 'USA (Berkeley)', url: 'https://cran.cnr.berkeley.edu/', country: 'US', city: 'Berkeley', priority: 30 },
  { name: 'USA (RStudio)', url: 'https://cran.rstudio.com/', country: 'US', city: 'Multiple', priority: 31 },
  { name: 'Canada (Toronto)', url: 'https://cran.utstat.utoronto.ca/', country: 'CA', city: 'Toronto', priority: 32 },
  
  // 官方主镜像（作为后备）
  { name: 'CRAN Master (Austria)', url: 'https://cran.r-project.org/', country: 'AT', city: 'Vienna', priority: 100 },
];

/**
 * 根据用户的地理位置信息选择最佳镜像源
 */
export async function selectBestMirror(): Promise<CRANMirror[]> {
  try {
    // 尝试通过 IP 地理定位 API 获取用户位置
    const geoInfo = await getUserGeolocation();
    
    if (geoInfo) {
      console.log('🌍 检测到用户位置:', geoInfo);
      return sortMirrorsByLocation(geoInfo);
    }
  } catch (error) {
    console.warn('⚠️ 无法获取地理位置信息，使用默认镜像顺序:', error);
  }
  
  // 如果无法获取位置，返回默认优先级排序
  return [...CRAN_MIRRORS].sort((a, b) => a.priority - b.priority);
}

/**
 * 获取用户地理位置信息
 */
async function getUserGeolocation(): Promise<{ country: string; continent?: string } | null> {
  try {
    // 使用免费的 IP 地理定位 API
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000,
    } as any);
    
    if (!response.ok) {
      throw new Error('Geolocation API request failed');
    }
    
    const data = await response.json();
    return {
      country: data.country_code || 'US',
      continent: data.continent_code,
    };
  } catch (error) {
    // 如果 API 失败，尝试备用 API
    try {
      const response = await fetch('https://ipinfo.io/json', {
        timeout: 5000,
      } as any);
      
      if (!response.ok) {
        throw new Error('Backup geolocation API request failed');
      }
      
      const data = await response.json();
      return {
        country: data.country || 'US',
      };
    } catch (backupError) {
      console.warn('⚠️ 备用地理定位 API 也失败了:', backupError);
      return null;
    }
  }
}

/**
 * 根据用户位置对镜像源进行排序
 */
function sortMirrorsByLocation(geoInfo: { country: string; continent?: string }): CRANMirror[] {
  const mirrors = [...CRAN_MIRRORS];
  
  // 定义地理位置优先级规则
  const getLocationPriority = (mirror: CRANMirror): number => {
    // 1. 同国家的镜像优先级最高
    if (mirror.country === geoInfo.country) {
      return mirror.priority;
    }
    
    // 2. 同大洲的镜像次之
    const continentMap: Record<string, string[]> = {
      'AS': ['CN', 'JP', 'KR', 'SG', 'IN'], // 亚洲
      'EU': ['GB', 'DE', 'FR', 'AT', 'NL'], // 欧洲
      'NA': ['US', 'CA', 'MX'],             // 北美
      'SA': ['BR', 'AR', 'CL'],             // 南美
      'OC': ['AU', 'NZ'],                   // 大洋洲
      'AF': ['ZA'],                         // 非洲
    };
    
    if (geoInfo.continent) {
      const continentCountries = continentMap[geoInfo.continent] || [];
      if (continentCountries.includes(mirror.country)) {
        return mirror.priority + 50;
      }
    }
    
    // 3. 其他地区的镜像
    return mirror.priority + 100;
  };
  
  // 按照地理位置优先级排序
  mirrors.sort((a, b) => {
    const priorityA = getLocationPriority(a);
    const priorityB = getLocationPriority(b);
    return priorityA - priorityB;
  });
  
  console.log('📊 镜像源排序结果（前5个）:');
  mirrors.slice(0, 5).forEach((mirror, index) => {
    console.log(`  ${index + 1}. ${mirror.name} (${mirror.country}) - ${mirror.url}`);
  });
  
  return mirrors;
}

/**
 * 测试镜像源的可用性和速度
 */
export async function testMirrorSpeed(mirror: CRANMirror): Promise<number> {
  const startTime = Date.now();
  
  try {
    // 尝试访问镜像源的一个小文件来测试速度
    const response = await fetch(`${mirror.url}PACKAGES`, {
      method: 'HEAD',
      timeout: 10000,
    } as any);
    
    if (!response.ok) {
      return Infinity; // 不可用
    }
    
    const endTime = Date.now();
    return endTime - startTime;
  } catch (error) {
    console.warn(`⚠️ 镜像源 ${mirror.name} 不可用:`, error);
    return Infinity;
  }
}

/**
 * 选择最快的可用镜像源
 */
export async function selectFastestMirror(mirrors: CRANMirror[], maxTest: number = 3): Promise<CRANMirror> {
  console.log(`🔍 正在测试前 ${maxTest} 个镜像源的速度...`);
  
  const testMirrors = mirrors.slice(0, maxTest);
  const speedTests = await Promise.all(
    testMirrors.map(async (mirror) => ({
      mirror,
      speed: await testMirrorSpeed(mirror),
    }))
  );
  
  // 找到最快的镜像
  speedTests.sort((a, b) => a.speed - b.speed);
  
  const fastest = speedTests[0];
  if (fastest && fastest.speed !== Infinity) {
    console.log(`✅ 选择最快的镜像源: ${fastest.mirror.name} (${fastest.speed}ms)`);
    return fastest.mirror;
  }
  
  // 如果所有测试的镜像都不可用，返回第一个作为后备
  console.warn('⚠️ 所有测试的镜像源都不可用，使用默认镜像');
  return mirrors[0];
}

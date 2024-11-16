import axios from 'axios';

axios.defaults.baseURL = "https://kbiz.kasikornbank.com";

const formUrlEncoded = (obj: Record<string, any>): string =>
  Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

const timeoutPromise = (ms: number) => 
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout exceeded')), ms));

const getCookieByName = (cookies: string[], name: string): string | null => {
  const cookie = cookies
    .map(cookie => cookie.split(";")[0].split("="))
    .find(([cookieName]) => cookieName.trim() === name);
  return cookie ? cookie[1] : null;
};

class KBiz {
  private username: string;
  private password: string;
  private bankAccountNumber: string;
  private ibId?: string;
  private token?: string;

  constructor({ username, password, bankAccountNumber, ibId, token }: { username: string; password: string; bankAccountNumber: string; ibId?: string; token?: string }) {
    [{ fieldName: 'username', value: username }, { fieldName: 'password', value: password }, { fieldName: 'bankAccountNumber', value: bankAccountNumber }]
      .forEach(({ fieldName, value }) => {
        if (!value?.trim()) {
          throw new Error(`${fieldName} is required.`);
        }
      });

    this.username = username;
    this.password = password;
    this.bankAccountNumber = bankAccountNumber;
    this.ibId = ibId;
    this.token = token;

    if (this.token) axios.defaults.headers.common["Authorization"] = this.token;
    if (this.ibId) axios.defaults.headers.common["X-IB-ID"] = this.ibId;
  }

  resetSession() {
    this.ibId = undefined;
    this.token = undefined;
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["X-IB-ID"];
    delete axios.defaults.headers.common["Cookie"];
  }

  async login() {
    try {
      const { headers: createCookieHeaders, data: loginPageData } = await axios.post("/authen/login.do");
      const alteonP = getCookieByName(createCookieHeaders['set-cookie'], 'AlteonP');
      const jSessionId = getCookieByName(createCookieHeaders['set-cookie'], 'JSESSIONID');
      const tokenId = this.extractBetween(loginPageData, `id="tokenId" value="`, `"/>`);

      const loginResponse = await axios.post(
        "/authen/login.do",
        formUrlEncoded({ userName: this.username, password: this.password, tokenId, cmd: "authenticate", locale: "th" }),
        { headers: { 'Cookie': `AlteonP=${alteonP}; JSESSIONID=${jSessionId}` } }
      );

      if (!loginResponse.headers['set-cookie']) throw new Error("Can't find set-cookie in response headers.");

      const rssoJSessionId = getCookieByName(loginResponse.headers['set-cookie'], 'JSESSIONID');
      const { data } = await axios.get('/authen/ib/redirectToIB.jsp', { headers: { Cookie: `AlteonP=${alteonP}; JSESSIONID=${rssoJSessionId};` } });
      const rsso = this.extractBetween(data, `dataRsso=`, `";`);
      const result = await axios.post("/services/api/authentication/validateSession", { dataRsso: rsso });

      this.ibId = result.data.data.userProfiles[0].ibId;
      this.token = result.headers["x-session-token"];
      axios.defaults.headers.common["Authorization"] = this.token;
      axios.defaults.headers.common["X-IB-ID"] = this.ibId;
      axios.defaults.headers.common["Cookie"] = `AlteonP=${alteonP};`;

      return { success: true, ibId: this.ibId, token: this.token };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false };
    }
  }

  async checkSession() {
    try {
      await axios.post("/services/api/refreshSession", {});
      return true;
    } catch (error) {
      console.error("UnAuthorized Please wait !");
      return false;
    }
  }

  async initializeSession() {
    if (this.token && this.ibId) {
      try {
        console.log("Checking session...");
        const sessionIsAlive = await Promise.race([
          this.checkSession(),
          timeoutPromise(10000)
        ]);
  
        if (sessionIsAlive) {
          console.log("Session is alive.");
          return await this.getUserInfo();
        } else {
          console.log("Session expired. Re-logging in...");
          this.resetSession();
          const loginData = await this.login();
          if (!loginData.success) {
            return { success: false, message: "Re-login failed after session expired." };
          }
          return await this.getUserInfo();
        }
      } catch (error) {
        if (error.message === 'Timeout exceeded') {
          console.log("Timeout occurred. Retrying login...");
          this.resetSession();
          const loginData = await this.login();
          if (!loginData.success) {
            return { success: false, message: "Session timed out, and re-login failed." };
          }
          return await this.getUserInfo();
        }
        // console.error("err msg : ", error);
        return { success: false, message: "An error occurred during session initialization." };
      }
    }

    const loginData = await this.login();
    if (!loginData.success) {
      console.log('Login failed.');
      return { success: false, message: 'Login failed.' };
    }
  
    return await this.getUserInfo();
  }
  

  async getTransactionList(limitRow = 7, startDate: string | null = null, endDate: string | null = null) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const formattedStartDate = startDate || `${firstDayOfMonth.getDate().toString().padStart(2, '0')}/${(firstDayOfMonth.getMonth() + 1).toString().padStart(2, '0')}/${firstDayOfMonth.getFullYear()}`;
    const formattedEndDate = endDate || `${lastDayOfMonth.getDate().toString().padStart(2, '0')}/${(lastDayOfMonth.getMonth() + 1).toString().padStart(2, '0')}/${lastDayOfMonth.getFullYear()}`;

    try {
      const response = await axios.post(
        "/services/api/accountsummary/getRecentTransactionList",
        {
          acctNo: this.bankAccountNumber,
          acctType: "SA",
          custType: "IX",
          endDate: formattedEndDate,
          ownerId: this.ibId,
          ownerType: "Company",
          pageNo: "1",
          rowPerPage: limitRow,
          startDate: formattedStartDate
        },
        {
          headers: {
            'Referer': 'https://kbiz.kasikornbank.com/menu/account/account/recent-transaction',
            'Content-Type': 'application/json',
            'Authorization': this.token,
            'X-SESSION-IBID': this.ibId,
            'X-IB-ID': this.ibId,
            'X-VERIFY': 'Y',
            'X-RE-FRESH': 'N',
          }
        }
      );

      const { data: { data: { recentTransactionList } } } = response;
      const transactionDetails = await Promise.all(recentTransactionList.map(async (transaction) => {
        const detail = await this.getRecentTransactionDetail(
          transaction.transDate, transaction.origRqUid, transaction.originalSourceId, 
          transaction.debitCreditIndicator, transaction.transCode, transaction.transType
        );
        return { ...transaction, detail: detail.data };
      }));

      return transactionDetails;
    } catch (error) {
      if (error.response?.status === 401) {
        this.resetSession();
        await this.login();
        return await this.getTransactionList(limitRow, startDate, endDate);
      }
      // console.error('err msg : ', error);
      return [];
    }
  }

  async getRecentTransactionDetail(transDate: string, origRqUid: string, originalSourceId: string, debitCreditIndicator: string, transCode: string, transType: string) {
    try {
      const { data } = await axios.post("/services/api/accountsummary/getRecentTransactionDetail", {
        transDate: transDate.split(" ")[0],
        acctNo: this.bankAccountNumber,
        origRqUid,
        custType: "IX",
        originalSourceId,
        transCode,
        debitCreditIndicator,
        transType,
        ownerType: "Company",
        ownerId: this.ibId,
      });

      return data;
    } catch (error) {
      if (error.response?.status === 401) {
        this.resetSession();
        await this.login();
        return await this.getRecentTransactionDetail(transDate, origRqUid, originalSourceId, debitCreditIndicator, transCode, transType);
      }
      console.error('Error fetching transaction detail:', error);
      return null;
    }
  }

  async getUserInfo() {
    try {
      const { data: { data } } = await axios.post("/services/api/accountsummary/getAccountSummaryList", {
        custType: "IX",
        isReload: "N",
        lang: "th",
        nicknameType: "OWNAC",
        ownerId: this.ibId,
        ownerType: "Company",
        pageAmount: 6,
      });
      return data;
    } catch (error) {
      if (error.response?.status === 401) {
        this.resetSession();
        await this.login();
        return await this.getUserInfo();
      }
      // console.error('err msg : ', error);
      return null;
    }
  }

  extractBetween(str: string, start: string, end: string): string {
    const startIndex = str.indexOf(start) + start.length;
    return str.substring(startIndex, str.indexOf(end, startIndex));
  }
}

export default KBiz;

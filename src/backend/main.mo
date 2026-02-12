import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type Price = {
    price : Float;
    change : Float;
    changePercent : Float;
    currency : Text;
  };

  public type Holding = {
    ticker : Text;
    shares : Float;
    avgCost : Float;
    assetType : Text;
    color : Text;
    currentPrice : Price;
  };

  public type Portfolio = {
    name : Text;
    holdings : [Holding];
    isPublic : Bool;
    createdAt : Nat64;
    lastUpdated : Nat64;
  };

  let _userPortfolios = Map.empty<Principal, [Portfolio]>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userCryptoHoldings = Map.empty<Principal, [Holding]>();

  func getPortfoliosByOwner(owner : Principal) : [Portfolio] {
    switch (_userPortfolios.get(owner)) {
      case (null) { [] };
      case (?portfolios) { portfolios };
    };
  };

  func setPortfoliosForOwner(owner : Principal, portfolios : [Portfolio]) {
    if (portfolios.isEmpty()) {
      _userPortfolios.remove(owner);
    } else {
      _userPortfolios.add(owner, portfolios);
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func fetchYahooData(symbol : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch market data");
    };
    let url = "https://finance.yahoo.com/quote/" # symbol # "/";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchHistoricalData(symbol : Text, range : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch historical data");
    };
    let url = "https://finance.yahoo.com/quote/" # symbol # "/history?range=" # range;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func searchTickers(symbol : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search tickers");
    };
    let url = "https://query2.finance.yahoo.com/v1/finance/search?q=" # symbol # "&quotes_count=10";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public func getDefaultCurrency() : async Text { "USD" };

  public shared ({ caller }) func getPortfolios() : async [Portfolio] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access portfolios");
    };
    getPortfoliosByOwner(caller);
  };

  public shared ({ caller }) func createPortfolio(name : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create portfolios");
    };
    let portfolios = getPortfoliosByOwner(caller);
    let newPortfolio : Portfolio = {
      name;
      holdings = [];
      isPublic = false;
      createdAt = 0;
      lastUpdated = 0;
    };
    setPortfoliosForOwner(caller, portfolios.concat([newPortfolio]));
  };

  public shared ({ caller }) func updatePortfolio(updatedPortfolio : Portfolio) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update portfolios");
    };
    let currentPortfolios = getPortfoliosByOwner(caller);
    if (currentPortfolios.isEmpty()) {
      Runtime.trap("Portfolio does not exist");
    };
    let updated = currentPortfolios.map(
      func(p) { if (p.name == updatedPortfolio.name) { updatedPortfolio } else { p } }
    );
    setPortfoliosForOwner(caller, updated);
  };

  public shared ({ caller }) func deletePortfolio(name : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete portfolios");
    };
    let currentPortfolios = getPortfoliosByOwner(caller);
    if (currentPortfolios.isEmpty()) {
      Runtime.trap("Portfolio does not exist");
    };
    let filtered = currentPortfolios.filter(func(p) { p.name != name });
    if (filtered.size() == currentPortfolios.size()) {
      Runtime.trap("Portfolio not found");
    };
    setPortfoliosForOwner(caller, filtered);
  };

  public shared ({ caller }) func changePortfolioPrivacy(portfolioName : Text, isPublic : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can change portfolio privacy");
    };
    let currentPortfolios = getPortfoliosByOwner(caller);
    if (currentPortfolios.isEmpty()) {
      Runtime.trap("Portfolio does not exist");
    };
    let updated = currentPortfolios.map(
      func(p) {
        if (p.name == portfolioName) { { p with isPublic } } else { p };
      }
    );
    setPortfoliosForOwner(caller, updated);
  };

  public shared ({ caller }) func addHolding(portfolioName : Text, holding : Holding) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add holdings");
    };
    let currentPortfolios = getPortfoliosByOwner(caller);
    if (currentPortfolios.isEmpty()) {
      Runtime.trap("Portfolio does not exist");
    };
    let updated = currentPortfolios.map(
      func(p) {
        if (p.name == portfolioName) { { p with holdings = p.holdings.concat([holding]) } } else {
          p;
        };
      }
    );
    setPortfoliosForOwner(caller, updated);
  };

  public shared ({ caller }) func removeHolding(portfolioName : Text, ticker : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove holdings");
    };
    let currentPortfolios = getPortfoliosByOwner(caller);
    if (currentPortfolios.isEmpty()) {
      Runtime.trap("Portfolio does not exist");
    };
    let updated = currentPortfolios.map(
      func(p) {
        if (p.name == portfolioName) {
          let filtered = p.holdings.filter(func(h) { h.ticker != ticker });
          { p with holdings = filtered };
        } else { p };
      }
    );
    setPortfoliosForOwner(caller, updated);
  };

  public query func getPublicPortfolio(owner : Principal, portfolioName : Text) : async Portfolio {
    let portfolios = getPortfoliosByOwner(owner);
    if (portfolios.isEmpty()) {
      Runtime.trap("Owner not found");
    };
    let portfolio = portfolios.find(func(p) { p.name == portfolioName });
    switch (portfolio) {
      case (null) {
        Runtime.trap("Portfolio not found");
      };
      case (?p) {
        if (not p.isPublic) {
          Runtime.trap("This portfolio is not public");
        };
        p;
      };
    };
  };

  public query ({ caller }) func getPortfolioPerformance(_portfolioName : Text, _range : Text) : async [
    (Nat, Float)
  ] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view portfolio performance");
    };
    [];
  };

  public shared ({ caller }) func getCryptoHoldings() : async [Holding] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view crypto holdings");
    };
    switch (userCryptoHoldings.get(caller)) {
      case (null) { [] };
      case (?holdings) { holdings };
    };
  };

  public shared ({ caller }) func addCryptoHolding(holding : Holding) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add crypto holdings");
    };
    let existing = if (userCryptoHoldings.get(caller) == null) { [] } else {
      switch (userCryptoHoldings.get(caller)) {
        case (null) { [] };
        case (?holdings) { holdings };
      };
    };
    let updated = existing.concat([holding]);
    userCryptoHoldings.add(caller, updated);
  };

  public shared ({ caller }) func removeCryptoHolding(ticker : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove crypto holdings");
    };
    let existingCrypto = if (userCryptoHoldings.get(caller) == null) {
      [];
    } else {
      switch (userCryptoHoldings.get(caller)) {
        case (null) { [] };
        case (?crypto) { crypto };
      };
    };
    let filtered = existingCrypto.filter(func(h) { h.ticker != ticker });
    userCryptoHoldings.add(caller, filtered);
  };

  public shared ({ caller }) func searchCryptoTickers(searchTerm : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search crypto tickers");
    };
    let url = "https://api.coingecko.com/api/v3/search?query=" # searchTerm;
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func getCryptoLivePrice(cryptoId : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch crypto prices");
    };
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=" # cryptoId # "&vs_currencies=usd";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func getCryptoHistoricalData(
    cryptoId : Text,
    vsCurrency : Text,
    days : Text,
  ) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can fetch crypto historical data");
    };
    let url = "https://api.coingecko.com/api/v3/coins/" # cryptoId # "/market_chart?vs_currency=" # vsCurrency
      # "&days=" # days;
    await OutCall.httpGetRequest(url, [], transform);
  };
};

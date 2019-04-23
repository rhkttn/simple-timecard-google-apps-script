function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('シンプルタイムカード')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * シートIDをユーザープロパティにセット
 */
function setSheetId_(sheetId) {
  PropertiesService.getUserProperties().setProperty('SIMPLE_TIMECARD_SHEET_ID', sheetId);
}

/**
 * ユーザープロパティに保存したシートID取得
 */
function getSheetId_() {
  return PropertiesService.getUserProperties().getProperty('SIMPLE_TIMECARD_SHEET_ID');
}

/**
 * スプレッドシート作成
 */
function createSpreadsheet_() {
  var newSpreadSheet = SpreadsheetApp.create('シンプルタイムカード');
  var sheetId = newSpreadSheet.getId();
  if(sheetId) {
    setSheetId_(sheetId);
    newSpreadSheet.getActiveSheet().appendRow(['日付', '出勤', '退勤', '勤務時間', '残業時間']);
    return sheetId;
  }
}

/**
 * 出退勤情報を保存する
 */
function setAttendance(type) {
  // ユーザープロパティに保存しているシートIDを取得->操作対象のスプレッドシートのシートオブジェクトを取得
  var sheetId = getSheetId_();
  if(!sheetId) {
    sheetId = createSpreadsheet_();
  }
  var ss = SpreadsheetApp.openById(sheetId);
  var s = ss.getSheetByName('シート1');
  
  // 最終行を取得
  var lastRow = s.getLastRow();
  var last = s.getRange(lastRow, 1, 1, s.getLastColumn());
  var lastData = last.getValues();
  
  // 日付文字列
  var now = new Date();
  var lastStr = Utilities.formatDate(new Date(lastData[0][1]), 'JST', 'yyyy/MM/dd');
  var nowStr = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd');
  
  //Logger.log(lastData);
  
  if(type == 'going_to_work') {
    // 出勤
    if(lastStr == nowStr && !lastData[0][2]) {
      // 同一日で退勤が未入力の場合はエラー
      throw Utilities.formatString('既に%sの出勤は登録済みです。', nowStr);
    }
    //出勤時刻の登録
    var data = [];
    data[0] = Utilities.formatDate(now, 'JST', 'yyyy/MM/dd');
    data[1] = now;
    s.appendRow(data);
    return  {
      message: '出勤を登録しました。',
      go: Utilities.formatDate(new Date(data[1]), 'JST', 'yyyy/MM/dd HH:mm'),
      leave: '--',
      work: '--',
      over: '--'
    };
  }
  if(type == 'leaving_to_work') {
    // 退勤
    var goDate = new Date(lastData[0][1]);
    if(lastData[0][2]) {
      throw '既に退勤は登録済みか、出勤が記録されていません。';
    } else {
      lastData[0][2] = now; //退勤時間
      var workHour = (now.getTime() - goDate.getTime()) / 1000 / 60 / 60;
      workHour = Math.round(workHour * 100) / 100 - 1.00; //勤務時間（休憩1H）
      var overHour = (workHour - 8.00).toFixed(2); // 残業時間
      lastData[0][3] = workHour;
      lastData[0][4] = overHour;
      last.setValues(lastData);
      var lastLeaveCell = s.getRange(lastRow, 3);
      if(lastLeaveCell) {
        lastLeaveCell.setNumberFormat('yyyy/MM/dd hh:mm:ss'); // シートのフォーマットを変更
      }
      return {
        message: '退勤を登録しました。',
        go: Utilities.formatDate(goDate, 'JST', 'yyyy/MM/dd HH:mm'),
        leave: Utilities.formatDate(new Date(lastData[0][2]), 'JST', 'yyyy/MM/dd HH:mm'),
        work: workHour,
        over: overHour
      };
    }
  }
}

function testFunc() {
  try{
    Logger.log(setAttendance('going_to_work'));
  } catch (e) {
    Logger.log(e);
  }
}

function test() {
  //PropertiesService.getUserProperties().setProperty('sheet_id', '');
  if(!getSheetId_()) {
    Logger.log(createSpreadsheet_());
  } else {
    Logger.log('既に作成済み:' + getSheetId_());
  }
}
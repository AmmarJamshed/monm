Attribute VB_Name = "ThisWorkbook"
Private Sub Workbook_Open()
    Dim fp As String, api As String, url As String
    On Error Resume Next
    fp = ThisWorkbook.Sheets("_MonM").Range("A1").Value
    api = ThisWorkbook.Sheets("_MonM").Range("A2").Value
    On Error GoTo 0
    If Len(fp) < 64 Or Len(api) < 10 Then Exit Sub
    url = api & "/api/media/fingerprint/" & fp & "/killed"
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.Open "GET", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.Send
    If http.Status = 200 Then
        Dim json As String
        json = http.responseText
        If InStr(json, """killed"":true") > 0 Or InStr(json, """killed"": true") > 0 Then
            MsgBox "Content disabled - kill switch activated.", vbExclamation, "MonM"
            Application.Visible = False
            ThisWorkbook.Close SaveChanges:=False
            End
        End If
    End If
End Sub

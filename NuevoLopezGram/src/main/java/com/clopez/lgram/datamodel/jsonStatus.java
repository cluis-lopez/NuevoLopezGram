package com.clopez.lgram.datamodel;

public class jsonStatus {

	private String status;
	private String message;
	
	public jsonStatus(String status, String message) {
		this.status = status;
		this.message = message;
	}
	
	public String getStatus() {
		return status;
	}
	
	public String getMessage() {
		return message;
	}
	}

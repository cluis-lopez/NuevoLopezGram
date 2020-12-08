package com.clopez.lgram.datamodel;

import java.util.Date;
import java.util.UUID;

import org.springframework.cloud.gcp.data.datastore.core.mapping.Entity;
import org.springframework.data.annotation.Id;

@Entity
public class RemovedUser {
	
	@Id
	String id;
	
	private User user;
	private Date removedAt;
	private Date cleanedAt;
	
	public RemovedUser(User user) {
		this.id = user.getEmail();
		this.user = user;
		this.removedAt = new Date();
	}
	
	public String getEmail() {
		return user.getEmail();
	}
	
	public String getUserId() {
		return user.getId();
	}
	
	public void setCleanedAt(Date cleaned) {
		this.cleanedAt = cleaned;
	}
}

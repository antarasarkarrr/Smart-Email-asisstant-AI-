package com.email.email_writer;

import lombok.Data;

@Data
public class EmailRequest {
	private String emailContent;
	private String tone;

	    // Getters
	    public String getTone() {
	        return tone;
	    }

	    public String getEmailContent() {
	        return emailContent;
	    }

	    // Setters (optional if using @RequestBody)
	    public void setTone(String tone) {
	        this.tone = tone;
	    }

	    public void setEmailContent(String emailContent) {
	        this.emailContent = emailContent;
	    }
	}



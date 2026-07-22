package com.uniservice.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix="security.jwt")
public class JwtProperties {
    private String secret;
    private long accessTokenMinutes=15;
    private long refreshTokenDays=7;
    public String getSecret(){return secret;}
    public void setSecret(String secret){this.secret=secret;}
    public long getAccessTokenMinutes(){return accessTokenMinutes;}
    public void setAccessTokenMinutes(long v){this.accessTokenMinutes=v;}
    public long getRefreshTokenDays(){return refreshTokenDays;}
    public void setRefreshTokenDays(long v){this.refreshTokenDays=v;}
}
